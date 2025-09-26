import { ClientOptions, Model, EmbedContentRequest, EmbedContentResponse, LyriaPredictRequest, LyriaPredictResponse, VeoPredictRequest, VeoOperation, VeoOperationRequest } from './types.js';
import { GenerateContentRequest, GenerateContentResponse, GenerateContentStreamResult, ImagenPredictRequest, ImagenPredictResponse } from '../common/types.js';
import 'google-auth-library';
import 'genkit';

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

declare function listModels(clientOptions: ClientOptions): Promise<Model[]>;
declare function generateContent(model: string, generateContentRequest: GenerateContentRequest, clientOptions: ClientOptions): Promise<GenerateContentResponse>;
declare function generateContentStream(model: string, generateContentRequest: GenerateContentRequest, clientOptions: ClientOptions): Promise<GenerateContentStreamResult>;
declare function embedContent(model: string, embedContentRequest: EmbedContentRequest, clientOptions: ClientOptions): Promise<EmbedContentResponse>;
declare function imagenPredict(model: string, imagenPredictRequest: ImagenPredictRequest, clientOptions: ClientOptions): Promise<ImagenPredictResponse>;
declare function lyriaPredict(model: string, lyriaPredictRequest: LyriaPredictRequest, clientOptions: ClientOptions): Promise<LyriaPredictResponse>;
declare function veoPredict(model: string, veoPredictRequest: VeoPredictRequest, clientOptions: ClientOptions): Promise<VeoOperation>;
declare function veoCheckOperation(model: string, veoOperationRequest: VeoOperationRequest, clientOptions: ClientOptions): Promise<VeoOperation>;
declare function getVertexAIUrl(params: {
    includeProjectAndLocation: boolean;
    resourcePath: string;
    resourceMethod?: string;
    queryParams?: string;
    clientOptions: ClientOptions;
}): string;
declare function getFetchOptions(params: {
    method: 'POST' | 'GET';
    body?: string;
    clientOptions: ClientOptions;
}): Promise<RequestInit>;
declare function getAbortSignal(clientOptions: ClientOptions): AbortSignal | undefined;
declare function getHeaders(clientOptions: ClientOptions): Promise<HeadersInit>;
declare function makeRequest(url: string, fetchOptions: RequestInit): Promise<Response>;
declare const TEST_ONLY: {
    getFetchOptions: typeof getFetchOptions;
    getAbortSignal: typeof getAbortSignal;
    getHeaders: typeof getHeaders;
    makeRequest: typeof makeRequest;
};

export { TEST_ONLY, embedContent, generateContent, generateContentStream, getVertexAIUrl, imagenPredict, listModels, lyriaPredict, veoCheckOperation, veoPredict };
