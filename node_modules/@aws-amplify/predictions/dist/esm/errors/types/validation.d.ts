import { AmplifyErrorMap } from '@aws-amplify/core/internals/utils';
export declare enum PredictionsValidationErrorCode {
    CelebrityDetectionNotEnabled = "CelebrityDetectionNotEnabled",
    InvalidInput = "InvalidInput",
    InvalidSource = "InvalidSource",
    NoCredentials = "NoCredentials",
    NoLanguage = "NoLanguage",
    NoRegion = "NoRegion",
    NoSource = "NoSource",
    NoSourceLanguage = "NoSourceLanguage",
    NoTargetLanguage = "NoTargetLanguage",
    NoVoiceId = "NoVoiceId"
}
export declare const validationErrorMap: AmplifyErrorMap<PredictionsValidationErrorCode>;
