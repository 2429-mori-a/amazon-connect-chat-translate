import { PredictionsError } from '../PredictionsError.mjs';
import { validationErrorMap } from '../types/validation.mjs';

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
function assertValidationError(assertion, name) {
    if (!assertion) {
        const { message, recoverySuggestion } = validationErrorMap[name];
        throw new PredictionsError({ name, message, recoverySuggestion });
    }
}

export { assertValidationError };
//# sourceMappingURL=assertValidationError.mjs.map
