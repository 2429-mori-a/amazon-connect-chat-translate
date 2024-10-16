import { IdentifyEntitiesInput, IdentifyEntitiesOutput, IdentifyLabelsInput, IdentifyLabelsOutput, IdentifyTextInput, IdentifyTextOutput } from '../types';
export declare class AmazonAIIdentifyPredictionsProvider {
    private rekognitionClient?;
    private textractClient?;
    getProviderName(): string;
    identify(input: IdentifyTextInput | IdentifyLabelsInput | IdentifyEntitiesInput): Promise<IdentifyTextOutput | IdentifyLabelsOutput | IdentifyEntitiesOutput>;
    /**
     * Verify user input source and converts it into source object readable by Rekognition and Textract.
     * Note that Rekognition and Textract use the same source interface, so we need not worry about types.
     * @param {IdentifySource} source - User input source that directs to the object user wants
     * to identify (storage, file, or bytes).
     * @return {Promise<Image>} - Promise resolving to the converted source object.
     */
    private configureSource;
    /**
     * Recognize text from real-world images and documents (plain text, forms and tables). Detects text in the input
     * image and converts it into machine-readable text.
     * @param {IdentifySource} source - Object containing the source image and feature types to analyze.
     * @return {Promise<IdentifyTextOutput>} - Promise resolving to object containing identified texts.
     */
    protected identifyText(input: IdentifyTextInput): Promise<IdentifyTextOutput>;
    /**
     * Identify instances of real world entities from an image and if it contains unsafe content.
     * @param {IdentifyLabelsInput} input - Object containing the source image and entity type to identify.
     * @return {Promise<IdentifyLabelsOutput>} - Promise resolving to an array of identified entities.
     */
    protected identifyLabels(input: IdentifyLabelsInput): Promise<IdentifyLabelsOutput>;
    /**
     * Calls Rekognition.detectLabels and organizes the returned data.
     * @param param - parameters as {@link DetectLabelsCommandInput} to be passed onto Rekognition
     * @return a promise resolving to organized detectLabels response as {@link IdentifyLabelsOutput}.
     */
    private detectLabels;
    /**
     * Calls Rekognition.detectModerationLabels and organizes the returned data.
     * @param param parameter to be passed onto Rekognition as {@link DetectModerationLabelsCommandInput}
     * @return a promise resolving to organized detectModerationLabels response as {@link IdentifyLabelsOutput}.
     */
    private detectModerationLabels;
    /**
     * Identify faces within an image that is provided as input, and match faces from a collection
     * or identify celebrities.
     * @param input - object of {@link IdentifyEntitiesInput} containing the source image and face match options.
     * @return a promise resolving to identify results as {@link IdentifyEntitiesOutput}.
     */
    protected identifyEntities(input: IdentifyEntitiesInput): Promise<IdentifyEntitiesOutput>;
    private decodeExternalImageId;
}
