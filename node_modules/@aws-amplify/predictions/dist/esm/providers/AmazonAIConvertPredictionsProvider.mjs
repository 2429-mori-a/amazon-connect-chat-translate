import { Buffer } from 'buffer';
import { ConsoleLogger, Amplify, fetchAuthSession } from '@aws-amplify/core';
import { getAmplifyUserAgentObject, Category, PredictionsAction, Signer } from '@aws-amplify/core/internals/utils';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate';
import { EventStreamCodec } from '@smithy/eventstream-codec';
import { toUtf8, fromUtf8 } from '@smithy/util-utf8';
import { PredictionsValidationErrorCode } from '../errors/types/validation.mjs';
import { assertValidationError } from '../errors/utils/assertValidationError.mjs';
import { isValidConvertInput, isTranslateTextInput, isTextToSpeechInput, isConvertBytesSource } from '../types/Predictions.mjs';

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const logger = new ConsoleLogger('AmazonAIConvertPredictionsProvider');
const eventBuilder = new EventStreamCodec(toUtf8, fromUtf8);
const LANGUAGES_CODE_IN_8KHZ = ['fr-FR', 'en-AU', 'en-GB', 'fr-CA'];
class AmazonAIConvertPredictionsProvider {
    constructor() {
        this.inputSampleRate = 44100;
    }
    getProviderName() {
        return 'AmazonAIConvertPredictionsProvider';
    }
    convert(input) {
        assertValidationError(isValidConvertInput(input), PredictionsValidationErrorCode.InvalidInput);
        if (isTranslateTextInput(input)) {
            logger.debug('translateText');
            return this.translateText(input);
        }
        else if (isTextToSpeechInput(input)) {
            logger.debug('textToSpeech');
            return this.convertTextToSpeech(input);
        }
        else {
            logger.debug('textToSpeech');
            return this.convertSpeechToText(input);
        }
    }
    async translateText(input) {
        logger.debug('Starting translation');
        const { translateText = {} } = Amplify.getConfig().Predictions?.convert ?? {};
        assertValidationError(!!translateText.region, PredictionsValidationErrorCode.NoRegion);
        const { defaults = {}, region } = translateText;
        const { credentials } = await fetchAuthSession();
        assertValidationError(!!credentials, PredictionsValidationErrorCode.NoCredentials);
        const { sourceLanguage, targetLanguage } = defaults;
        const sourceLanguageCode = input.translateText?.source?.language ?? sourceLanguage;
        const targetLanguageCode = input.translateText?.targetLanguage ?? targetLanguage;
        assertValidationError(!!sourceLanguageCode, PredictionsValidationErrorCode.NoSourceLanguage);
        assertValidationError(!!targetLanguageCode, PredictionsValidationErrorCode.NoTargetLanguage);
        this.translateClient = new TranslateClient({
            region,
            credentials,
            customUserAgent: getAmplifyUserAgentObject({
                category: Category.Predictions,
                action: PredictionsAction.Convert,
            }),
        });
        const translateTextCommand = new TranslateTextCommand({
            SourceLanguageCode: sourceLanguageCode,
            TargetLanguageCode: targetLanguageCode,
            Text: input.translateText?.source?.text,
        });
        const data = await this.translateClient.send(translateTextCommand);
        return {
            text: data.TranslatedText,
            language: data.TargetLanguageCode,
        };
    }
    async convertTextToSpeech(input) {
        const { credentials } = await fetchAuthSession();
        assertValidationError(!!credentials, PredictionsValidationErrorCode.NoCredentials);
        assertValidationError(!!input.textToSpeech?.source, PredictionsValidationErrorCode.NoSource);
        const { speechGenerator } = Amplify.getConfig().Predictions?.convert ?? {};
        assertValidationError(!!speechGenerator?.region, PredictionsValidationErrorCode.NoRegion);
        const { defaults = {}, region } = speechGenerator;
        const { voiceId: defaultVoiceId } = defaults;
        const voiceId = input.textToSpeech?.voiceId ?? defaultVoiceId;
        assertValidationError(!!voiceId, PredictionsValidationErrorCode.NoVoiceId);
        this.pollyClient = new PollyClient({
            region,
            credentials,
            customUserAgent: getAmplifyUserAgentObject({
                category: Category.Predictions,
                action: PredictionsAction.Convert,
            }),
        });
        const synthesizeSpeechCommand = new SynthesizeSpeechCommand({
            OutputFormat: 'mp3',
            Text: input.textToSpeech?.source?.text,
            VoiceId: voiceId,
            TextType: 'text',
            SampleRate: '24000',
        });
        const data = await this.pollyClient.send(synthesizeSpeechCommand);
        const response = new Response(data.AudioStream);
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], {
            type: data.ContentType,
        });
        const url = URL.createObjectURL(blob);
        return {
            speech: { url },
            audioStream: arrayBuffer,
            text: input.textToSpeech?.source?.text,
        };
    }
    async convertSpeechToText(input) {
        logger.debug('starting transcription..');
        const { credentials } = await fetchAuthSession();
        assertValidationError(!!credentials, PredictionsValidationErrorCode.NoCredentials);
        const { transcription } = Amplify.getConfig().Predictions?.convert ?? {};
        assertValidationError(!!transcription?.region, PredictionsValidationErrorCode.NoRegion);
        const { defaults, region } = transcription;
        const language = input.transcription?.language ?? defaults?.language;
        assertValidationError(!!language, PredictionsValidationErrorCode.NoLanguage);
        const source = input.transcription?.source;
        assertValidationError(isConvertBytesSource(source), PredictionsValidationErrorCode.InvalidSource);
        const connection = await this.openConnectionWithTranscribe({
            credentials,
            region,
            languageCode: language,
        });
        const fullText = await this.sendDataToTranscribe({
            connection,
            raw: source.bytes,
            languageCode: language,
        });
        return {
            transcription: {
                fullText,
            },
        };
    }
    static serializeDataFromTranscribe(message) {
        let decodedMessage = '';
        const transcribeMessage = eventBuilder.decode(Buffer.from(message.data));
        const transcribeMessageJson = JSON.parse(toUtf8(transcribeMessage.body));
        if (transcribeMessage.headers[':message-type'].value === 'exception') {
            logger.debug('exception', JSON.stringify(transcribeMessageJson.Message, null, 2));
            throw new Error(transcribeMessageJson.Message);
        }
        else if (transcribeMessage.headers[':message-type'].value === 'event') {
            if (transcribeMessageJson.Transcript.Results.length > 0) {
                if (transcribeMessageJson.Transcript.Results[0].Alternatives.length > 0) {
                    if (transcribeMessageJson.Transcript.Results[0].Alternatives[0]
                        .Transcript.length > 0) {
                        if (transcribeMessageJson.Transcript.Results[0].IsPartial === false) {
                            decodedMessage =
                                transcribeMessageJson.Transcript.Results[0].Alternatives[0]
                                    .Transcript + '\n';
                            logger.debug({ decodedMessage });
                        }
                        else {
                            logger.debug({
                                transcript: transcribeMessageJson.Transcript.Results[0].Alternatives[0],
                            });
                        }
                    }
                }
            }
        }
        return decodedMessage;
    }
    sendDataToTranscribe({ connection, raw, languageCode, }) {
        return new Promise((resolve, reject) => {
            let fullText = '';
            connection.onmessage = message => {
                try {
                    const decodedMessage = AmazonAIConvertPredictionsProvider.serializeDataFromTranscribe(message);
                    if (decodedMessage) {
                        fullText += decodedMessage + ' ';
                    }
                }
                catch (err) {
                    logger.debug(err);
                    reject(err);
                }
            };
            connection.onerror = errorEvent => {
                logger.debug({ errorEvent });
                reject(new Error('failed to transcribe, network error'));
            };
            connection.onclose = closeEvent => {
                logger.debug({ closeEvent });
                resolve(fullText.trim());
            };
            logger.debug({ raw });
            if (Array.isArray(raw)) {
                for (let i = 0; i < raw.length - 1023; i += 1024) {
                    const data = raw.slice(i, i + 1024);
                    this.sendEncodedDataToTranscribe(connection, data, languageCode);
                }
            }
            else {
                // If Buffer
                this.sendEncodedDataToTranscribe(connection, raw, languageCode);
            }
            // sending end frame
            const endFrameEventMessage = this.getAudioEventMessage(Buffer.from([]));
            const endFrameBinary = eventBuilder.encode(endFrameEventMessage);
            connection.send(endFrameBinary);
        });
    }
    sendEncodedDataToTranscribe(connection, data, languageCode) {
        const downsampledBuffer = this.downsampleBuffer({
            buffer: data,
            outputSampleRate: LANGUAGES_CODE_IN_8KHZ.includes(languageCode)
                ? 8000
                : 16000,
        });
        const pcmEncodedBuffer = this.pcmEncode(downsampledBuffer);
        const audioEventMessage = this.getAudioEventMessage(Buffer.from(pcmEncodedBuffer));
        const binary = eventBuilder.encode(audioEventMessage);
        connection.send(binary);
    }
    getAudioEventMessage(buffer) {
        const audioEventMessage = {
            body: buffer,
            headers: {
                ':message-type': {
                    type: 'string',
                    value: 'event',
                },
                ':event-type': {
                    type: 'string',
                    value: 'AudioEvent',
                },
            },
        };
        return audioEventMessage;
    }
    pcmEncode(input) {
        let offset = 0;
        // ArrayBuffer cannot be processed using length property
        if (input instanceof ArrayBuffer) {
            return input;
        }
        const buffer = new ArrayBuffer(input.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < input.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, input[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }
        return buffer;
    }
    downsampleBuffer({ buffer, outputSampleRate = 16000, }) {
        // Cannot process ArrayBuffer using length property
        if (outputSampleRate === this.inputSampleRate ||
            buffer instanceof ArrayBuffer) {
            return buffer;
        }
        const sampleRateRatio = this.inputSampleRate / outputSampleRate;
        const newLength = Math.round(buffer.length / sampleRateRatio);
        const result = new Float32Array(newLength);
        let offsetResult = 0;
        let offsetBuffer = 0;
        while (offsetResult < result.length) {
            const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
            let accum = 0;
            let count = 0;
            for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
                accum += buffer[i];
                count++;
            }
            result[offsetResult] = accum / count;
            offsetResult++;
            offsetBuffer = nextOffsetBuffer;
        }
        return result;
    }
    openConnectionWithTranscribe({ credentials, region, languageCode, }) {
        return new Promise((resolve, _reject) => {
            const signedUrl = this.generateTranscribeUrl({
                credentials,
                region,
                languageCode,
            });
            logger.debug('connecting...');
            const connection = new WebSocket(signedUrl);
            connection.binaryType = 'arraybuffer';
            connection.onopen = () => {
                logger.debug('connected');
                resolve(connection);
            };
        });
    }
    generateTranscribeUrl({ credentials: { accessKeyId, secretAccessKey, sessionToken }, region, languageCode, }) {
        const credentials = {
            access_key: accessKeyId,
            secret_key: secretAccessKey,
            session_token: sessionToken,
        };
        const url = [
            `wss://transcribestreaming.${region}.amazonaws.com:8443`,
            '/stream-transcription-websocket?',
            `media-encoding=pcm&`,
            `sample-rate=${LANGUAGES_CODE_IN_8KHZ.includes(languageCode) ? '8000' : '16000'}&`,
            `language-code=${languageCode}`,
        ].join('');
        const signedUrl = Signer.signUrl(url, credentials, { region, service: 'transcribe' }, 300);
        return signedUrl;
    }
}

export { AmazonAIConvertPredictionsProvider };
//# sourceMappingURL=AmazonAIConvertPredictionsProvider.mjs.map
