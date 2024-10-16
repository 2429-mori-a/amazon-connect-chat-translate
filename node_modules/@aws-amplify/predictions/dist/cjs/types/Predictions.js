'use strict';

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInterpretTextOthers = exports.isInterpretTextInput = exports.isIdentifyEntitiesInput = exports.isIdentifyLabelsInput = exports.isIdentifyTextInput = exports.isIdentifyBytesSource = exports.isConvertBytesSource = exports.isFileSource = exports.isStorageSource = exports.isSpeechToTextInput = exports.isTextToSpeechInput = exports.isTranslateTextInput = exports.isIdentifyCelebrities = exports.isIdentifyFromCollection = exports.isValidInterpretInput = exports.isValidIdentifyInput = exports.isValidConvertInput = void 0;
function isValidConvertInput(obj) {
    return (isTranslateTextInput(obj) ||
        isTextToSpeechInput(obj) ||
        isSpeechToTextInput(obj));
}
exports.isValidConvertInput = isValidConvertInput;
function isValidIdentifyInput(obj) {
    return (isIdentifyTextInput(obj) ||
        isIdentifyLabelsInput(obj) ||
        isIdentifyEntitiesInput(obj));
}
exports.isValidIdentifyInput = isValidIdentifyInput;
function isValidInterpretInput(obj) {
    return isInterpretTextInput(obj);
}
exports.isValidInterpretInput = isValidInterpretInput;
function isIdentifyFromCollection(obj) {
    const key = 'collection';
    const keyId = 'collectionId';
    return (obj &&
        (Object.prototype.hasOwnProperty.call(obj, key) ||
            Object.prototype.hasOwnProperty.call(obj, keyId)));
}
exports.isIdentifyFromCollection = isIdentifyFromCollection;
function isIdentifyCelebrities(obj) {
    const key = 'celebrityDetection';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
exports.isIdentifyCelebrities = isIdentifyCelebrities;
function isTranslateTextInput(obj) {
    const key = 'translateText';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
exports.isTranslateTextInput = isTranslateTextInput;
function isTextToSpeechInput(obj) {
    const key = 'textToSpeech';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
exports.isTextToSpeechInput = isTextToSpeechInput;
function isSpeechToTextInput(obj) {
    const key = 'transcription';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
exports.isSpeechToTextInput = isSpeechToTextInput;
function isStorageSource(obj) {
    const key = 'key';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
exports.isStorageSource = isStorageSource;
function isFileSource(obj) {
    const key = 'file';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
exports.isFileSource = isFileSource;
function isConvertBytesSource(obj) {
    const key = 'bytes';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
exports.isConvertBytesSource = isConvertBytesSource;
function isIdentifyBytesSource(obj) {
    const key = 'bytes';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
exports.isIdentifyBytesSource = isIdentifyBytesSource;
function isIdentifyTextInput(obj) {
    const key = 'text';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
exports.isIdentifyTextInput = isIdentifyTextInput;
function isIdentifyLabelsInput(obj) {
    const key = 'labels';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
exports.isIdentifyLabelsInput = isIdentifyLabelsInput;
function isIdentifyEntitiesInput(obj) {
    const key = 'entities';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
exports.isIdentifyEntitiesInput = isIdentifyEntitiesInput;
function isInterpretTextInput(obj) {
    const key = 'text';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
exports.isInterpretTextInput = isInterpretTextInput;
function isInterpretTextOthers(text) {
    return text.source.language !== undefined;
}
exports.isInterpretTextOthers = isInterpretTextOthers;
//# sourceMappingURL=Predictions.js.map
