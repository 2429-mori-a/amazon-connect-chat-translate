import { AmplifyError } from '@aws-amplify/core/internals/utils';

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
class PredictionsError extends AmplifyError {
    constructor(params) {
        super(params);
        // TODO: Delete the following 2 lines after we change the build target to >= es2015
        this.constructor = PredictionsError;
        Object.setPrototypeOf(this, PredictionsError.prototype);
    }
}

export { PredictionsError };
//# sourceMappingURL=PredictionsError.mjs.map
