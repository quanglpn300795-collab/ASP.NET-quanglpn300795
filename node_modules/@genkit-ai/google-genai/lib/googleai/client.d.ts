import { ClientOptions, Model, EmbedContentRequest, EmbedContentResponse, VeoPredictRequest, VeoOperation } from './types.js';
import { GenerateContentRequest, GenerateContentResponse, GenerateContentStreamResult, ImagenPredictRequest, ImagenPredictResponse } from '../common/types.js';
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

/**
 * Lists available models.
 *
 * https://ai.google.dev/api/models#method:-models.list
 *
 * @param apiKey The API key to authenticate the request.
 * @param clientOptions Optional options to customize the request
 * @returns A promise that resolves to an array of Model objects.
 */
declare function listModels(apiKey: string, clientOptions?: ClientOptions): Promise<Model[]>;
/**
 * Generates content using the Google AI API.
 *
 * @param {string} apiKey The API key for authentication.
 * @param {string} model The name of the model to use for content generation.
 * @param {GenerateContentRequest} generateContentRequest The request object containing the content generation parameters.
 * @param {ClientOptions} [clientOptions] Optional client options.
 * @returns {Promise<GenerateContentResponse>} A promise that resolves to the content generation response.
 * @throws {Error} If the API request fails or the response cannot be parsed.
 */
declare function generateContent(apiKey: string, model: string, generateContentRequest: GenerateContentRequest, clientOptions?: ClientOptions): Promise<GenerateContentResponse>;
/**
 * Generates a stream of content using the Google AI API.
 *
 * @param {string} apiKey The API key for authentication.
 * @param {string} model The name of the model to use for content generation.
 * @param {GenerateContentRequest} generateContentRequest The request object containing the content generation parameters.
 * @param {ClientOptions} [clientOptions] Optional client options.
 * @returns {Promise<GenerateContentStreamResult>} A promise that resolves to an object containing a both the stream and aggregated response.
 * @throws {Error} If the API request fails.
 */
declare function generateContentStream(apiKey: string, model: string, generateContentRequest: GenerateContentRequest, clientOptions?: ClientOptions): Promise<GenerateContentStreamResult>;
/**
 * Embeds content using the Google AI API.
 *
 * @param {string} apiKey The API key for authentication.
 * @param {string} model The name of the model to use for content embedding.
 * @param {EmbedContentRequest} embedContentRequest The request object containing the content to embed.
 * @param {ClientOptions} [clientOptions] Optional client options.
 * @returns {Promise<EmbedContentResponse>} A promise that resolves to the embedding response.
 * @throws {Error} If the API request fails or the response cannot be parsed.
 */
declare function embedContent(apiKey: string, model: string, embedContentRequest: EmbedContentRequest, clientOptions?: ClientOptions): Promise<EmbedContentResponse>;
declare function imagenPredict(apiKey: string, model: string, imagenPredictRequest: ImagenPredictRequest, clientOptions?: ClientOptions): Promise<ImagenPredictResponse>;
declare function veoPredict(apiKey: string, model: string, veoPredictRequest: VeoPredictRequest, clientOptions?: ClientOptions): Promise<VeoOperation>;
declare function veoCheckOperation(apiKey: string, operation: string, clientOptions?: ClientOptions): Promise<VeoOperation>;
/**
 * Generates a Google AI URL.
 *
 * @param params - An object containing the parameters for the URL.
 * @param params.path - The path for the URL (the part after the version)
 * @param params.task - An optional task
 * @param params.queryParams - An optional string of '&' delimited query parameters.
 * @param params.clientOptions - An optional object containing client options.
 * @returns The generated Google AI URL.
 */
declare function getGoogleAIUrl(params: {
    resourcePath: string;
    resourceMethod?: string;
    queryParams?: string;
    clientOptions?: ClientOptions;
}): string;
declare function getFetchOptions(params: {
    method: 'POST' | 'GET';
    apiKey: string;
    body?: string;
    clientOptions?: ClientOptions;
}): RequestInit;
declare function getAbortSignal(clientOptions?: ClientOptions): AbortSignal | undefined;
/**
 * Constructs the headers for an API request.
 *
 * @param {string} apiKey The API key for authentication.
 * @param {ClientOptions} [clientOptions] Optional client options, containing custom headers.
 * @returns {HeadersInit} An object containing the headers to be included in the request.
 */
declare function getHeaders(apiKey: string, clientOptions?: ClientOptions): HeadersInit;
/**
 * Makes a request to the specified URL with the provided options.
 *
 * @param {string} url The URL to make the request to.
 * @param {RequestInit} fetchOptions The options to pass to the `fetch` API.
 * @returns {Promise<Response>} A promise that resolves to the Response
 * @throws {Error} If the request fails
 */
declare function makeRequest(url: string, fetchOptions: RequestInit): Promise<Response>;
declare const TEST_ONLY: {
    getFetchOptions: typeof getFetchOptions;
    getAbortSignal: typeof getAbortSignal;
    getHeaders: typeof getHeaders;
    makeRequest: typeof makeRequest;
};

export { TEST_ONLY, embedContent, generateContent, generateContentStream, getGoogleAIUrl, imagenPredict, listModels, veoCheckOperation, veoPredict };
