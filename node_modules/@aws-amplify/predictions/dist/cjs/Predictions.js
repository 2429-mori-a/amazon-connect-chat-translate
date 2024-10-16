'use strict';

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.Predictions = exports.PredictionsClass = void 0;
const providers_1 = require("./providers");
class PredictionsClass {
    constructor() {
        this.convertProvider = new providers_1.AmazonAIConvertPredictionsProvider();
        this.identifyProvider = new providers_1.AmazonAIIdentifyPredictionsProvider();
        this.interpretProvider = new providers_1.AmazonAIInterpretPredictionsProvider();
    }
    getModuleName() {
        return 'Predictions';
    }
    interpret(input) {
        return this.interpretProvider.interpret(input);
    }
    convert(input) {
        return this.convertProvider.convert(input);
    }
    identify(input) {
        return this.identifyProvider.identify(input);
    }
}
exports.PredictionsClass = PredictionsClass;
exports.Predictions = new PredictionsClass();
//# sourceMappingURL=Predictions.js.map
