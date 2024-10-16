'use strict';

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertValidationError = void 0;
const PredictionsError_1 = require("../PredictionsError");
const validation_1 = require("../types/validation");
function assertValidationError(assertion, name) {
    if (!assertion) {
        const { message, recoverySuggestion } = validation_1.validationErrorMap[name];
        throw new PredictionsError_1.PredictionsError({ name, message, recoverySuggestion });
    }
}
exports.assertValidationError = assertValidationError;
//# sourceMappingURL=assertValidationError.js.map
