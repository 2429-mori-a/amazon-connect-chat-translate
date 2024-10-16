// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
function isValidConvertInput(obj) {
    return (isTranslateTextInput(obj) ||
        isTextToSpeechInput(obj) ||
        isSpeechToTextInput(obj));
}
function isValidIdentifyInput(obj) {
    return (isIdentifyTextInput(obj) ||
        isIdentifyLabelsInput(obj) ||
        isIdentifyEntitiesInput(obj));
}
function isValidInterpretInput(obj) {
    return isInterpretTextInput(obj);
}
function isIdentifyFromCollection(obj) {
    const key = 'collection';
    const keyId = 'collectionId';
    return (obj &&
        (Object.prototype.hasOwnProperty.call(obj, key) ||
            Object.prototype.hasOwnProperty.call(obj, keyId)));
}
function isIdentifyCelebrities(obj) {
    const key = 'celebrityDetection';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
function isTranslateTextInput(obj) {
    const key = 'translateText';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
function isTextToSpeechInput(obj) {
    const key = 'textToSpeech';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
function isSpeechToTextInput(obj) {
    const key = 'transcription';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
function isStorageSource(obj) {
    const key = 'key';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
function isFileSource(obj) {
    const key = 'file';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
function isConvertBytesSource(obj) {
    const key = 'bytes';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
function isIdentifyBytesSource(obj) {
    const key = 'bytes';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
function isIdentifyTextInput(obj) {
    const key = 'text';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
function isIdentifyLabelsInput(obj) {
    const key = 'labels';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
function isIdentifyEntitiesInput(obj) {
    const key = 'entities';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
function isInterpretTextInput(obj) {
    const key = 'text';
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
function isInterpretTextOthers(text) {
    return text.source.language !== undefined;
}

export { isConvertBytesSource, isFileSource, isIdentifyBytesSource, isIdentifyCelebrities, isIdentifyEntitiesInput, isIdentifyFromCollection, isIdentifyLabelsInput, isIdentifyTextInput, isInterpretTextInput, isInterpretTextOthers, isSpeechToTextInput, isStorageSource, isTextToSpeechInput, isTranslateTextInput, isValidConvertInput, isValidIdentifyInput, isValidInterpretInput };
//# sourceMappingURL=Predictions.mjs.map
