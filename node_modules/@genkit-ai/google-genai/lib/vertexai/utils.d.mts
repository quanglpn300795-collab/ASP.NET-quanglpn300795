import { GenkitError } from 'genkit';
import { GoogleAuth } from 'google-auth-library';
import { ClientOptions, VertexPluginOptions } from './types.mjs';
export { checkModelName, checkSupportedMimeType, cleanSchema, extractMedia, extractMimeType, extractText, extractVersion, modelName } from '../common/utils.mjs';
import '../common/types.mjs';
import 'genkit/model';

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

declare function setMockDerivedOptions(options: ClientOptions | undefined): void;
declare const TEST_ONLY: {
    setMockDerivedOptions: typeof setMockDerivedOptions;
};
declare function getDerivedOptions(options?: VertexPluginOptions, AuthClass?: typeof GoogleAuth): Promise<ClientOptions>;
/**
 * Retrieves an API key from environment variables.
 *
 * @returns The API key as a string, or `undefined` if none of the specified
 *          environment variables are set.
 */
declare function getApiKeyFromEnvVar(): string | undefined;
declare const MISSING_API_KEY_ERROR: GenkitError;
declare const API_KEY_FALSE_ERROR: GenkitError;
declare const NOT_SUPPORTED_IN_EXPRESS_ERROR: GenkitError;
/**
 * Checks and retrieves an API key based on the provided argument and environment variables.
 *
 * - If `pluginApiKey` is a non-empty string, it's used as the API key.
 * - If `pluginApiKey` is `undefined` or an empty string, it attempts to fetch the API key from environment
 * - If `pluginApiKey` is `false`, key retrieval from the environment is skipped, and the function
 *   will return `undefined`. This mode indicates that the API key is expected to be provided
 *   at a later stage or in a different context.
 *
 * @param pluginApiKey - An optional API key string, `undefined` to check the environment, or `false` to bypass all checks in this function.
 * @returns The resolved API key as a string, or `undefined` if `pluginApiKey` is `false`.
 * @throws {Error} MISSING_API_KEY_ERROR - Thrown if `pluginApiKey` is not `false` and no API key
 *   can be found either in the `pluginApiKey` argument or from the environment.
 */
declare function checkApiKey(pluginApiKey: string | false | undefined): string | undefined;
/**
 * Calculates and returns the effective API key based on multiple potential sources.
 * The order of precedence for determining the API key is:
 * 1. `requestApiKey` (if provided)
 * 2. `pluginApiKey` (if provided and not `false`)
 * 3. Environment variable (if `pluginApiKey` is not `false` and `pluginApiKey` is not provided)
 *
 * @param pluginApiKey - The apiKey value provided during plugin initialization.
 * @param requestApiKey - The apiKey provided to an individual generate call.
 * @returns The resolved API key as a string.
 * @throws {Error} API_KEY_FALSE_ERROR - Thrown if `pluginApiKey` is `false` and `requestApiKey` is not provided
 * @throws {Error} MISSING_API_KEY_ERROR - Thrown if no API key can be resolved from any source
 */
declare function calculateApiKey(pluginApiKey: string | false | undefined, requestApiKey: string | undefined): string;
/** Vertex Express Mode lets you try a *subset* of Vertex AI features */
declare function checkSupportedResourceMethod(params: {
    clientOptions: ClientOptions;
    resourcePath?: string;
    resourceMethod?: string;
}): void;

export { API_KEY_FALSE_ERROR, MISSING_API_KEY_ERROR, NOT_SUPPORTED_IN_EXPRESS_ERROR, TEST_ONLY, calculateApiKey, checkApiKey, checkSupportedResourceMethod, getApiKeyFromEnvVar, getDerivedOptions };
