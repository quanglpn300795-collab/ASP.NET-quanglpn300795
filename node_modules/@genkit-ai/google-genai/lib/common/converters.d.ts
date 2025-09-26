import { z } from 'genkit';
import { ToolDefinition, MessageData, ModelReference, CandidateData } from 'genkit/model';
import { FunctionDeclaration, Content, FunctionCallingMode, GenerateContentCandidate } from './types.js';

/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

declare function toGeminiTool(tool: ToolDefinition): FunctionDeclaration;
declare function toGeminiMessage(message: MessageData, model?: ModelReference<z.ZodTypeAny>): Content;
declare function toGeminiSystemInstruction(message: MessageData): Content;
/**
 * Converts mode from either genkit tool choice (lowercase)
 * or functionCallingConfig (uppercase).
 * @param from The mode to convert from
 * @returns
 */
declare function toGeminiFunctionModeEnum(from?: string): FunctionCallingMode | undefined;
declare function fromGeminiCandidate(candidate: GenerateContentCandidate): CandidateData;

export { fromGeminiCandidate, toGeminiFunctionModeEnum, toGeminiMessage, toGeminiSystemInstruction, toGeminiTool };
