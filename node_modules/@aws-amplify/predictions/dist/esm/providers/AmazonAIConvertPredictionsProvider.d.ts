import { SpeechToTextInput, SpeechToTextOutput, TextToSpeechInput, TextToSpeechOutput, TranslateTextInput, TranslateTextOutput } from '../types';
export declare class AmazonAIConvertPredictionsProvider {
    private translateClient?;
    private pollyClient?;
    getProviderName(): string;
    convert(input: TranslateTextInput | TextToSpeechInput | SpeechToTextInput): Promise<TextToSpeechOutput | TranslateTextOutput | SpeechToTextOutput>;
    protected translateText(input: TranslateTextInput): Promise<TranslateTextOutput>;
    protected convertTextToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput>;
    protected convertSpeechToText(input: SpeechToTextInput): Promise<SpeechToTextOutput>;
    static serializeDataFromTranscribe(message: MessageEvent): string;
    private sendDataToTranscribe;
    private sendEncodedDataToTranscribe;
    private getAudioEventMessage;
    private pcmEncode;
    private inputSampleRate;
    private downsampleBuffer;
    private openConnectionWithTranscribe;
    private generateTranscribeUrl;
}
