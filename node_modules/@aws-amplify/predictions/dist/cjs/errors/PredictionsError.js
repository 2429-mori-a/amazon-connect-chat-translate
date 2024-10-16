'use strict';

Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionsError = void 0;
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const utils_1 = require("@aws-amplify/core/internals/utils");
class PredictionsError extends utils_1.AmplifyError {
    constructor(params) {
        super(params);
        // TODO: Delete the following 2 lines after we change the build target to >= es2015
        this.constructor = PredictionsError;
        Object.setPrototypeOf(this, PredictionsError.prototype);
    }
}
exports.PredictionsError = PredictionsError;
//# sourceMappingURL=PredictionsError.js.map
