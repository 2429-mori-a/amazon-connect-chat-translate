'use strict';

Object.defineProperty(exports, "__esModule", { value: true });
exports.AmazonAIInterpretPredictionsProvider = void 0;
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const core_1 = require("@aws-amplify/core");
const utils_1 = require("@aws-amplify/core/internals/utils");
const client_comprehend_1 = require("@aws-sdk/client-comprehend");
const validation_1 = require("../errors/types/validation");
const assertValidationError_1 = require("../errors/utils/assertValidationError");
const types_1 = require("../types");
class AmazonAIInterpretPredictionsProvider {
    getProviderName() {
        return 'AmazonAIInterpretPredictionsProvider';
    }
    interpret(input) {
        (0, assertValidationError_1.assertValidationError)((0, types_1.isValidInterpretInput)(input), validation_1.PredictionsValidationErrorCode.InvalidInput);
        return this.interpretText(input);
    }
    async interpretText(input) {
        const { credentials } = await (0, core_1.fetchAuthSession)();
        (0, assertValidationError_1.assertValidationError)(!!credentials, validation_1.PredictionsValidationErrorCode.NoCredentials);
        const { interpretText = {} } = core_1.Amplify.getConfig().Predictions?.interpret ?? {};
        const { region = '', defaults = {} } = interpretText;
        const { type: defaultType = '' } = defaults;
        const { text: textSource } = input;
        const { source, type = defaultType } = textSource;
        const { text } = source;
        let sourceLanguage;
        if ((0, types_1.isInterpretTextOthers)(textSource)) {
            sourceLanguage = textSource.source.language;
        }
        this.comprehendClient = new client_comprehend_1.ComprehendClient({
            credentials,
            region,
            customUserAgent: (0, utils_1.getAmplifyUserAgentObject)({
                category: utils_1.Category.Predictions,
                action: utils_1.PredictionsAction.Interpret,
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
            (0, assertValidationError_1.assertValidationError)(!!languageCode, validation_1.PredictionsValidationErrorCode.NoLanguage);
            const entitiesDetectionParams = {
                Text: text,
                LanguageCode: languageCode,
            };
            entitiesPromise = this.detectEntities(entitiesDetectionParams);
        }
        let sentimentPromise;
        if (doAll || type === 'sentiment') {
            (0, assertValidationError_1.assertValidationError)(!!languageCode, validation_1.PredictionsValidationErrorCode.NoLanguage);
            const sentimentParams = {
                Text: text,
                LanguageCode: languageCode,
            };
            sentimentPromise = this.detectSentiment(sentimentParams);
        }
        let syntaxPromise;
        if (doAll || type === 'syntax') {
            (0, assertValidationError_1.assertValidationError)(!!languageCode, validation_1.PredictionsValidationErrorCode.NoLanguage);
            const syntaxParams = {
                Text: text,
                LanguageCode: languageCode,
            };
            syntaxPromise = this.detectSyntax(syntaxParams);
        }
        let keyPhrasesPromise;
        if (doAll || type === 'keyPhrases') {
            (0, assertValidationError_1.assertValidationError)(!!languageCode, validation_1.PredictionsValidationErrorCode.NoLanguage);
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
            const detectKeyPhrasesCommand = new client_comprehend_1.DetectKeyPhrasesCommand(params);
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
            const detectSyntaxCommand = new client_comprehend_1.DetectSyntaxCommand(params);
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
            const detectSentimentCommand = new client_comprehend_1.DetectSentimentCommand(params);
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
            const detectEntitiesCommand = new client_comprehend_1.DetectEntitiesCommand(params);
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
            const detectDominantLanguageCommand = new client_comprehend_1.DetectDominantLanguageCommand(params);
            const data = await this.comprehendClient.send(detectDominantLanguageCommand);
            const { Languages: [{ LanguageCode }] = [{ LanguageCode: undefined }] } = data ?? {};
            (0, assertValidationError_1.assertValidationError)(!!LanguageCode, validation_1.PredictionsValidationErrorCode.NoLanguage);
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
exports.AmazonAIInterpretPredictionsProvider = AmazonAIInterpretPredictionsProvider;
//# sourceMappingURL=AmazonAIInterpretPredictionsProvider.js.map
