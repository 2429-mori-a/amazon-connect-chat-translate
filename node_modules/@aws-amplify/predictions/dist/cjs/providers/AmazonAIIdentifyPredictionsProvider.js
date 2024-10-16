'use strict';

Object.defineProperty(exports, "__esModule", { value: true });
exports.AmazonAIIdentifyPredictionsProvider = void 0;
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const core_1 = require("@aws-amplify/core");
const utils_1 = require("@aws-amplify/core/internals/utils");
const storage_1 = require("@aws-amplify/storage");
const client_rekognition_1 = require("@aws-sdk/client-rekognition");
const client_textract_1 = require("@aws-sdk/client-textract");
const validation_1 = require("../errors/types/validation");
const assertValidationError_1 = require("../errors/utils/assertValidationError");
const types_1 = require("../types");
const IdentifyTextUtils_1 = require("./IdentifyTextUtils");
const Utils_1 = require("./Utils");
const logger = new core_1.ConsoleLogger('AmazonAIIdentifyPredictionsProvider');
class AmazonAIIdentifyPredictionsProvider {
    getProviderName() {
        return 'AmazonAIIdentifyPredictionsProvider';
    }
    identify(input) {
        (0, assertValidationError_1.assertValidationError)((0, types_1.isValidIdentifyInput)(input), validation_1.PredictionsValidationErrorCode.InvalidInput);
        if ((0, types_1.isIdentifyTextInput)(input)) {
            logger.debug('identifyText');
            return this.identifyText(input);
        }
        else if ((0, types_1.isIdentifyLabelsInput)(input)) {
            logger.debug('identifyLabels');
            return this.identifyLabels(input);
        }
        else {
            logger.debug('identifyEntities');
            return this.identifyEntities(input);
        }
    }
    /**
     * Verify user input source and converts it into source object readable by Rekognition and Textract.
     * Note that Rekognition and Textract use the same source interface, so we need not worry about types.
     * @param {IdentifySource} source - User input source that directs to the object user wants
     * to identify (storage, file, or bytes).
     * @return {Promise<Image>} - Promise resolving to the converted source object.
     */
    configureSource(source) {
        return new Promise((resolve, reject) => {
            if ((0, types_1.isStorageSource)(source)) {
                const storageConfig = {
                    accessLevel: source.level,
                    targetIdentityId: source.identityId,
                };
                (0, storage_1.getUrl)({ key: source.key, options: storageConfig })
                    .then(value => {
                    const parser = /https:\/\/([a-zA-Z0-9%\-_.]+)\.s3\.[A-Za-z0-9%\-._~]+\/([a-zA-Z0-9%\-._~/]+)\?/;
                    const parsedURL = value.url.toString().match(parser) ?? '';
                    if (parsedURL.length < 3)
                        reject(new Error('Invalid S3 key was given.'));
                    resolve({
                        S3Object: {
                            Bucket: parsedURL[1],
                            Name: decodeURIComponent(parsedURL[2]),
                        },
                    });
                })
                    .catch(err => {
                    reject(err);
                });
            }
            else if ((0, types_1.isFileSource)(source)) {
                (0, Utils_1.blobToArrayBuffer)(source.file)
                    .then(buffer => {
                    resolve({ Bytes: new Uint8Array(buffer) });
                })
                    .catch(err => {
                    reject(err);
                });
            }
            else if ((0, types_1.isIdentifyBytesSource)(source)) {
                const { bytes } = source;
                if (bytes instanceof Blob) {
                    (0, Utils_1.blobToArrayBuffer)(bytes)
                        .then(buffer => {
                        resolve({ Bytes: new Uint8Array(buffer) });
                    })
                        .catch(err => {
                        reject(err);
                    });
                }
                if (bytes instanceof ArrayBuffer || bytes instanceof Buffer) {
                    resolve({ Bytes: new Uint8Array(bytes) });
                }
                // everything else can be directly passed to Rekognition / Textract.
                resolve({ Bytes: bytes });
            }
            else {
                reject(new Error('Input source is not configured correctly.'));
            }
        });
    }
    /**
     * Recognize text from real-world images and documents (plain text, forms and tables). Detects text in the input
     * image and converts it into machine-readable text.
     * @param {IdentifySource} source - Object containing the source image and feature types to analyze.
     * @return {Promise<IdentifyTextOutput>} - Promise resolving to object containing identified texts.
     */
    async identifyText(input) {
        const { credentials } = await (0, core_1.fetchAuthSession)();
        (0, assertValidationError_1.assertValidationError)(!!credentials, validation_1.PredictionsValidationErrorCode.NoCredentials);
        const { identifyText = {} } = core_1.Amplify.getConfig().Predictions?.identify ?? {};
        const { region = '', defaults = {} } = identifyText;
        const { format: configFormat = 'PLAIN' } = defaults;
        this.rekognitionClient = new client_rekognition_1.RekognitionClient({
            region,
            credentials,
            customUserAgent: _getPredictionsIdentifyAmplifyUserAgent(),
        });
        this.textractClient = new client_textract_1.TextractClient({
            region,
            credentials,
            customUserAgent: _getPredictionsIdentifyAmplifyUserAgent(),
        });
        const inputDocument = await this.configureSource(input.text?.source);
        // get default value if format isn't specified in the input.
        const format = input.text?.format ?? configFormat;
        const featureTypes = []; // structures we want to analyze (e.g. [TABLES, FORMS]).
        if (format === 'FORM' || format === 'ALL')
            featureTypes.push('FORMS');
        if (format === 'TABLE' || format === 'ALL')
            featureTypes.push('TABLES');
        if (featureTypes.length === 0) {
            /**
             * Empty featureTypes indicates that we will identify plain text. We will use rekognition (suitable
             * for everyday images but has 50 word limit) first and see if reaches its word limit. If it does, then
             * we call textract and use the data that identify more words.
             */
            const textractParam = {
                Document: inputDocument,
            };
            const rekognitionParam = {
                Image: inputDocument,
            };
            const detectTextCommand = new client_rekognition_1.DetectTextCommand(rekognitionParam);
            const rekognitionData = await this.rekognitionClient.send(detectTextCommand);
            const rekognitionResponse = (0, IdentifyTextUtils_1.categorizeRekognitionBlocks)(rekognitionData.TextDetections);
            if (rekognitionResponse.text.words.length < 50) {
                // did not hit the word limit, return the data
                return rekognitionResponse;
            }
            const detectDocumentTextCommand = new client_textract_1.DetectDocumentTextCommand(textractParam);
            const { Blocks } = await this.textractClient.send(detectDocumentTextCommand);
            if ((rekognitionData.TextDetections?.length ?? 0) > (Blocks?.length ?? 0)) {
                return rekognitionResponse;
            }
            return (0, IdentifyTextUtils_1.categorizeTextractBlocks)(Blocks);
        }
        else {
            const param = {
                Document: inputDocument,
                FeatureTypes: featureTypes,
            };
            const analyzeDocumentCommand = new client_textract_1.AnalyzeDocumentCommand(param);
            const { Blocks } = await this.textractClient.send(analyzeDocumentCommand);
            return (0, IdentifyTextUtils_1.categorizeTextractBlocks)(Blocks);
        }
    }
    /**
     * Identify instances of real world entities from an image and if it contains unsafe content.
     * @param {IdentifyLabelsInput} input - Object containing the source image and entity type to identify.
     * @return {Promise<IdentifyLabelsOutput>} - Promise resolving to an array of identified entities.
     */
    async identifyLabels(input) {
        const { credentials } = await (0, core_1.fetchAuthSession)();
        (0, assertValidationError_1.assertValidationError)(!!credentials, validation_1.PredictionsValidationErrorCode.NoCredentials);
        const { identifyLabels = {} } = core_1.Amplify.getConfig().Predictions?.identify ?? {};
        const { region = '', defaults = {} } = identifyLabels;
        const { type = 'LABELS' } = defaults;
        this.rekognitionClient = new client_rekognition_1.RekognitionClient({
            region,
            credentials,
            customUserAgent: _getPredictionsIdentifyAmplifyUserAgent(),
        });
        const inputImage = await this.configureSource(input.labels?.source);
        const param = { Image: inputImage };
        const servicePromises = [];
        // get default argument
        const entityType = input.labels?.type ?? type;
        if (entityType === 'LABELS' || entityType === 'ALL') {
            servicePromises.push(this.detectLabels(param));
        }
        if (entityType === 'UNSAFE' || entityType === 'ALL') {
            servicePromises.push(this.detectModerationLabels(param));
        }
        return Promise.all(servicePromises).then(data => {
            let identifyResult = {};
            // concatenate resolved promises to a single object
            data.forEach(val => {
                identifyResult = { ...identifyResult, ...val };
            });
            return identifyResult;
        });
    }
    /**
     * Calls Rekognition.detectLabels and organizes the returned data.
     * @param param - parameters as {@link DetectLabelsCommandInput} to be passed onto Rekognition
     * @return a promise resolving to organized detectLabels response as {@link IdentifyLabelsOutput}.
     */
    async detectLabels(param) {
        const detectLabelsCommand = new client_rekognition_1.DetectLabelsCommand(param);
        const data = await this.rekognitionClient.send(detectLabelsCommand);
        if (!data.Labels)
            return {}; // no image was detected
        const detectLabelData = data.Labels.map(label => {
            const boxes = label.Instances?.map(instance => (0, Utils_1.makeCamelCase)(instance.BoundingBox)) || [];
            return {
                name: label.Name,
                boundingBoxes: boxes,
                metadata: {
                    confidence: label.Confidence,
                    parents: (0, Utils_1.makeCamelCaseArray)(label.Parents),
                },
            };
        });
        return { labels: detectLabelData };
    }
    /**
     * Calls Rekognition.detectModerationLabels and organizes the returned data.
     * @param param parameter to be passed onto Rekognition as {@link DetectModerationLabelsCommandInput}
     * @return a promise resolving to organized detectModerationLabels response as {@link IdentifyLabelsOutput}.
     */
    async detectModerationLabels(param) {
        const detectModerationLabelsCommand = new client_rekognition_1.DetectModerationLabelsCommand(param);
        const data = await this.rekognitionClient.send(detectModerationLabelsCommand);
        if (data.ModerationLabels?.length !== 0) {
            return { unsafe: 'YES' };
        }
        else {
            return { unsafe: 'NO' };
        }
    }
    /**
     * Identify faces within an image that is provided as input, and match faces from a collection
     * or identify celebrities.
     * @param input - object of {@link IdentifyEntitiesInput} containing the source image and face match options.
     * @return a promise resolving to identify results as {@link IdentifyEntitiesOutput}.
     */
    async identifyEntities(input) {
        const { credentials } = await (0, core_1.fetchAuthSession)();
        (0, assertValidationError_1.assertValidationError)(!!credentials, validation_1.PredictionsValidationErrorCode.NoCredentials);
        const { identifyEntities = {} } = core_1.Amplify.getConfig().Predictions?.identify ?? {};
        const { region = '', celebrityDetectionEnabled = false, defaults = {}, } = identifyEntities;
        const { collectionId: collectionIdConfig = '', maxEntities: maxFacesConfig = 50, } = defaults;
        // default arguments
        this.rekognitionClient = new client_rekognition_1.RekognitionClient({
            region,
            credentials,
            customUserAgent: _getPredictionsIdentifyAmplifyUserAgent(),
        });
        const inputImage = await this.configureSource(input.entities?.source);
        const param = { Attributes: ['ALL'], Image: inputImage };
        if ((0, types_1.isIdentifyCelebrities)(input.entities) &&
            input.entities.celebrityDetection) {
            (0, assertValidationError_1.assertValidationError)(celebrityDetectionEnabled, validation_1.PredictionsValidationErrorCode.CelebrityDetectionNotEnabled);
            const recognizeCelebritiesCommand = new client_rekognition_1.RecognizeCelebritiesCommand(param);
            const data = await this.rekognitionClient.send(recognizeCelebritiesCommand);
            const faces = data.CelebrityFaces?.map(celebrity => ({
                boundingBox: (0, Utils_1.makeCamelCase)(celebrity.Face?.BoundingBox),
                landmarks: (0, Utils_1.makeCamelCaseArray)(celebrity.Face?.Landmarks),
                metadata: {
                    ...(0, Utils_1.makeCamelCase)(celebrity, ['Id', 'Name', 'Urls']),
                    pose: (0, Utils_1.makeCamelCase)(celebrity.Face?.Pose),
                },
            })) ?? [];
            return { entities: faces };
        }
        else if ((0, types_1.isIdentifyFromCollection)(input.entities) &&
            input.entities.collection) {
            const { collectionId = collectionIdConfig, maxEntities: maxFaces = maxFacesConfig, } = input.entities;
            // Concatenate additional parameters
            const updatedParam = {
                ...param,
                CollectionId: collectionId,
                MaxFaces: maxFaces,
            };
            const searchFacesByImageCommand = new client_rekognition_1.SearchFacesByImageCommand(updatedParam);
            const data = await this.rekognitionClient.send(searchFacesByImageCommand);
            const faces = data.FaceMatches?.map(match => {
                const externalImageId = match.Face?.ExternalImageId
                    ? this.decodeExternalImageId(match.Face.ExternalImageId)
                    : undefined;
                return {
                    boundingBox: (0, Utils_1.makeCamelCase)(match.Face?.BoundingBox),
                    metadata: {
                        externalImageId,
                        similarity: match.Similarity,
                    },
                };
            }) ?? [];
            return { entities: faces };
        }
        else {
            const detectFacesCommand = new client_rekognition_1.DetectFacesCommand(param);
            const data = await this.rekognitionClient.send(detectFacesCommand);
            const faces = data.FaceDetails?.map(detail => {
                // face attributes keys we want to extract from Rekognition's response
                const attributeKeys = [
                    'Smile',
                    'Eyeglasses',
                    'Sunglasses',
                    'Gender',
                    'Beard',
                    'Mustache',
                    'EyesOpen',
                    'MouthOpen',
                ];
                const faceAttributes = (0, Utils_1.makeCamelCase)(detail, attributeKeys);
                faceAttributes.emotions = detail.Emotions?.map(emotion => emotion.Type);
                return {
                    boundingBox: (0, Utils_1.makeCamelCase)(detail.BoundingBox),
                    landmarks: (0, Utils_1.makeCamelCaseArray)(detail.Landmarks),
                    ageRange: (0, Utils_1.makeCamelCase)(detail.AgeRange),
                    attributes: faceAttributes,
                    metadata: {
                        confidence: detail.Confidence,
                        pose: (0, Utils_1.makeCamelCase)(detail.Pose),
                    },
                };
            }) ?? [];
            return { entities: faces };
        }
    }
    decodeExternalImageId(externalImageId) {
        return ('' + externalImageId).replace(/::/g, '/');
    }
}
exports.AmazonAIIdentifyPredictionsProvider = AmazonAIIdentifyPredictionsProvider;
function _getPredictionsIdentifyAmplifyUserAgent() {
    return (0, utils_1.getAmplifyUserAgentObject)({
        category: utils_1.Category.Predictions,
        action: utils_1.PredictionsAction.Identify,
    });
}
//# sourceMappingURL=AmazonAIIdentifyPredictionsProvider.js.map
