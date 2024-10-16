import { AmazonAIConvertPredictionsProvider } from './providers/AmazonAIConvertPredictionsProvider.mjs';
import { AmazonAIIdentifyPredictionsProvider } from './providers/AmazonAIIdentifyPredictionsProvider.mjs';
import { AmazonAIInterpretPredictionsProvider } from './providers/AmazonAIInterpretPredictionsProvider.mjs';

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
class PredictionsClass {
    constructor() {
        this.convertProvider = new AmazonAIConvertPredictionsProvider();
        this.identifyProvider = new AmazonAIIdentifyPredictionsProvider();
        this.interpretProvider = new AmazonAIInterpretPredictionsProvider();
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
const Predictions = new PredictionsClass();

export { Predictions, PredictionsClass };
//# sourceMappingURL=Predictions.mjs.map
