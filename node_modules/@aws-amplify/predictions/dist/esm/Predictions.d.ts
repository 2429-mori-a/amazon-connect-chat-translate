import { IdentifyEntitiesInput, IdentifyEntitiesOutput, IdentifyLabelsInput, IdentifyLabelsOutput, IdentifyTextInput, IdentifyTextOutput, InterpretTextInput, InterpretTextOutput, SpeechToTextInput, SpeechToTextOutput, TextToSpeechInput, TextToSpeechOutput, TranslateTextInput, TranslateTextOutput } from './types';
export declare class PredictionsClass {
    private convertProvider;
    private identifyProvider;
    private interpretProvider;
    getModuleName(): string;
    interpret(input: InterpretTextInput): Promise<InterpretTextOutput>;
    convert(input: TranslateTextInput): Promise<TranslateTextOutput>;
    convert(input: TextToSpeechInput): Promise<TextToSpeechOutput>;
    convert(input: SpeechToTextInput): Promise<SpeechToTextOutput>;
    identify(input: IdentifyTextInput): Promise<IdentifyTextOutput>;
    identify(input: IdentifyLabelsInput): Promise<IdentifyLabelsOutput>;
    identify(input: IdentifyEntitiesInput): Promise<IdentifyEntitiesOutput>;
}
export declare const Predictions: PredictionsClass;
