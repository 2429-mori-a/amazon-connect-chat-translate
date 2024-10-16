import { IdentifyTextOutput } from '../types';
import { BlockList, TextDetectionList } from '../types/AWSTypes';
/**
 * Organizes blocks from Rekognition API to each of the categories and and structures
 * their data accordingly.
 * @param {BlockList} source - Array containing blocks returned from Textract API.
 * @return {IdentifyTextOutput} -  Object that categorizes each block and its information.
 */
export declare function categorizeRekognitionBlocks(blocks: TextDetectionList): IdentifyTextOutput;
/**
 * Organizes blocks from Textract API to each of the categories and and structures
 * their data accordingly.
 * @param {BlockList} source - Array containing blocks returned from Textract API.
 * @return {IdentifyTextOutput} -  Object that categorizes each block and its information.
 */
export declare function categorizeTextractBlocks(blocks: BlockList): IdentifyTextOutput;
