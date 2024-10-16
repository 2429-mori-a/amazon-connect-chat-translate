import { fetchAuthSession, Amplify } from '@aws-amplify/core';
import { getAmplifyUserAgentObject, Category, PredictionsAction } from '@aws-amplify/core/internals/utils';
import { ComprehendClient, DetectKeyPhrasesCommand, DetectSyntaxCommand, DetectSentimentCommand, DetectEntitiesCommand, DetectDominantLanguageCommand } from '@aws-sdk/client-comprehend';
import { PredictionsValidationErrorCode } from '../errors/types/validation.mjs';
import { assertValidationError } from '../errors/utils/assertValidationError.mjs';
import { isValidInterpretInput, isInterpretTextOthers } from '../types/Predictions.mjs';

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
class AmazonAIInterpretPredictionsProvider {
    getProviderName() {
        return 'AmazonAIInterpretPredictionsProvider';
    }
    interpret(input) {
        assertValidationError(isValidInterpretInput(input), PredictionsValidationErrorCode.InvalidInput);
        return this.interpretText(input);
    }
    async interpretText(input) {
        const { credentials } = await fetchAuthSession();
        assertValidationError(!!credentials, PredictionsValidationErrorCode.NoCredentials);
        const { interpretText = {} } = Amplify.getConfig().Predictions?.interpret ?? {};
        const { region = '', defaults = {} } = interpretText;
        const { type: defaultType = '' } = defaults;
        const { text: textSource } = input;
        const { source, type = defaultType } = textSource;
        const { text } = source;
        let sourceLanguage;
        if (isInterpretTextOthers(textSource)) {
            sourceLanguage = textSource.source.language;
        }
        this.comprehendClient = new ComprehendClient({
            credentials,
            region,
            customUserAgent: getAmplifyUserAgentObject({
                category: Category.Predictions,
                action: PredictionsAction.Interpret,
            }),
        });
        const doAll = type === 'all';
        let languageCode = sourceLanguage;
        if (doAll || type === 'language') {
            const languageDetectionParams = {
                Text: text,
            };
            languageCode = await this.detectLanguage(languageDetectionParams);
        }
        let entitiesPromise;
        if (doAll || type === 'entities') {
            assertValidationError(!!languageCode, PredictionsValidationErrorCode.NoLanguage);
            const entitiesDetectionParams = {
                Text: text,
                LanguageCode: languageCode,
            };
            entitiesPromise = this.detectEntities(entitiesDetectionParams);
        }
        let sentimentPromise;
        if (doAll || type === 'sentiment') {
            assertValidationError(!!languageCode, PredictionsValidationErrorCode.NoLanguage);
            const sentimentParams = {
                Text: text,
                LanguageCode: languageCode,
            };
            sentimentPromise = this.detectSentiment(sentimentParams);
        }
        let syntaxPromise;
        if (doAll || type === 'syntax') {
            assertValidationError(!!languageCode, PredictionsValidationErrorCode.NoLanguage);
            const syntaxParams = {
                Text: text,
                LanguageCode: languageCode,
            };
            syntaxPromise = this.detectSyntax(syntaxParams);
        }
        let keyPhrasesPromise;
        if (doAll || type === 'keyPhrases') {
            assertValidationError(!!languageCode, PredictionsValidationErrorCode.NoLanguage);
            const keyPhrasesParams = {
                Text: text,
                LanguageCode: languageCode,
            };
            keyPhrasesPromise = this.detectKeyPhrases(keyPhrasesParams);
        }
        const [textEntities, sentiment, syntax, keyPhrases] = await Promise.all([
            entitiesPromise,
            sentimentPromise,
            syntaxPromise,
            keyPhrasesPromise,
        ]);
        return {
            textInterpretation: {
                keyPhrases,
                language: languageCode,
                sentiment,
                syntax,
                textEntities,
            },
        };
    }
    async detectKeyPhrases(params) {
        try {
            const detectKeyPhrasesCommand = new DetectKeyPhrasesCommand(params);
            const data = await this.comprehendClient.send(detectKeyPhrasesCommand);
            const { KeyPhrases: keyPhrases = [] } = data || {};
            return keyPhrases.map(({ Text: text }) => {
                return { text };
            });
        }
        catch (err) {
            if (err.code === 'AccessDeniedException') {
                throw new Error('Not authorized, did you enable Interpret Text on predictions category Amplify CLI? try: ' +
                    'amplify predictions add');
            }
            else {
                throw err;
            }
        }
    }
    async detectSyntax(params) {
        try {
            const detectSyntaxCommand = new DetectSyntaxCommand(params);
            const data = await this.comprehendClient.send(detectSyntaxCommand);
            const { SyntaxTokens = [] } = data || {};
            return this.serializeSyntaxFromComprehend(SyntaxTokens);
        }
        catch (err) {
            if (err.code === 'AccessDeniedException') {
                throw new Error('Not authorized, did you enable Interpret Text on predictions category Amplify CLI? try: ' +
                    'amplify predictions add');
            }
            else {
                throw err;
            }
        }
    }
    serializeSyntaxFromComprehend(tokens) {
        let response = [];
        if (tokens && Array.isArray(tokens)) {
            response = tokens.map(({ Text: text = '', PartOfSpeech: { Tag: syntax = '' } = {} }) => {
                return { text, syntax };
            });
        }
        return response;
    }
    async detectSentiment(params) {
        try {
            const detectSentimentCommand = new DetectSentimentCommand(params);
            const data = await this.comprehendClient.send(detectSentimentCommand);
            const { Sentiment: predominant = '', SentimentScore: { Positive: positive = 0, Negative: negative = 0, Neutral: neutral = 0, Mixed: mixed = 0, } = {}, } = data ?? {};
            return { predominant, positive, negative, neutral, mixed };
        }
        catch (err) {
            if (err.code === 'AccessDeniedException') {
                throw new Error('Not authorized, did you enable Interpret Text on predictions category Amplify CLI? try: ' +
                    'amplify predictions add');
            }
            else {
                throw err;
            }
        }
    }
    async detectEntities(params) {
        try {
            const detectEntitiesCommand = new DetectEntitiesCommand(params);
            const data = await this.comprehendClient.send(detectEntitiesCommand);
            const { Entities = [] } = data || {};
            return this.serializeEntitiesFromComprehend(Entities);
        }
        catch (err) {
            if (err.code === 'AccessDeniedException') {
                throw new Error('Not authorized, did you enable Interpret Text on predictions category Amplify CLI? try: ' +
                    'amplify predictions add');
            }
            else {
                throw err;
            }
        }
    }
    serializeEntitiesFromComprehend(data) {
        let response = [];
        if (data && Array.isArray(data)) {
            response = data.map(({ Type: type, Text: text }) => {
                return { type, text };
            });
        }
        return response;
    }
    async detectLanguage(params) {
        try {
            const detectDominantLanguageCommand = new DetectDominantLanguageCommand(params);
            const data = await this.comprehendClient.send(detectDominantLanguageCommand);
            const { Languages: [{ LanguageCode }] = [{ LanguageCode: undefined }] } = data ?? {};
            assertValidationError(!!LanguageCode, PredictionsValidationErrorCode.NoLanguage);
            return LanguageCode;
        }
        catch (err) {
            if (err.code === 'AccessDeniedException') {
                throw new Error('Not authorized, did you enable Interpret Text on predictions category Amplify CLI? try: ' +
                    'amplify predictions add');
            }
            else {
                throw err;
            }
        }
    }
}

export { AmazonAIInterpretPredictionsProvider };
//# sourceMappingURL=AmazonAIInterpretPredictionsProvider.mjs.map
