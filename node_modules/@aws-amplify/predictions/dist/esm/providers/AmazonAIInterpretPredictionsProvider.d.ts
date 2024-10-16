import { InterpretTextInput, InterpretTextOutput } from '../types';
export declare class AmazonAIInterpretPredictionsProvider {
    private comprehendClient?;
    getProviderName(): string;
    interpret(input: InterpretTextInput): Promise<InterpretTextOutput>;
    interpretText(input: InterpretTextInput): Promise<InterpretTextOutput>;
    private detectKeyPhrases;
    private detectSyntax;
    private serializeSyntaxFromComprehend;
    private detectSentiment;
    private detectEntities;
    private serializeEntitiesFromComprehend;
    private detectLanguage;
}
