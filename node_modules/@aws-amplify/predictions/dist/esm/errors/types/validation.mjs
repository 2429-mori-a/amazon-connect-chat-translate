// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var PredictionsValidationErrorCode;
(function (PredictionsValidationErrorCode) {
    PredictionsValidationErrorCode["CelebrityDetectionNotEnabled"] = "CelebrityDetectionNotEnabled";
    PredictionsValidationErrorCode["InvalidInput"] = "InvalidInput";
    PredictionsValidationErrorCode["InvalidSource"] = "InvalidSource";
    PredictionsValidationErrorCode["NoCredentials"] = "NoCredentials";
    PredictionsValidationErrorCode["NoLanguage"] = "NoLanguage";
    PredictionsValidationErrorCode["NoRegion"] = "NoRegion";
    PredictionsValidationErrorCode["NoSource"] = "NoSource";
    PredictionsValidationErrorCode["NoSourceLanguage"] = "NoSourceLanguage";
    PredictionsValidationErrorCode["NoTargetLanguage"] = "NoTargetLanguage";
    PredictionsValidationErrorCode["NoVoiceId"] = "NoVoiceId";
})(PredictionsValidationErrorCode || (PredictionsValidationErrorCode = {}));
const validationErrorMap = {
    [PredictionsValidationErrorCode.CelebrityDetectionNotEnabled]: {
        message: 'Celebrity Detection must be enabled.',
    },
    [PredictionsValidationErrorCode.InvalidInput]: {
        message: 'Input does not conform to expected type.',
    },
    [PredictionsValidationErrorCode.InvalidSource]: {
        message: 'Source type not supported.',
    },
    [PredictionsValidationErrorCode.NoCredentials]: {
        message: 'Credentials should not be empty.',
    },
    [PredictionsValidationErrorCode.NoLanguage]: {
        message: 'Missing language.',
    },
    [PredictionsValidationErrorCode.NoRegion]: {
        message: 'Missing region.',
    },
    [PredictionsValidationErrorCode.NoSource]: {
        message: 'Missing source.',
    },
    [PredictionsValidationErrorCode.NoSourceLanguage]: {
        message: 'Missing source language for translation.',
    },
    [PredictionsValidationErrorCode.NoTargetLanguage]: {
        message: 'Missing target language for translation.',
    },
    [PredictionsValidationErrorCode.NoVoiceId]: {
        message: 'Missing voice id.',
    },
};

export { PredictionsValidationErrorCode, validationErrorMap };
//# sourceMappingURL=validation.mjs.map
