"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var client_exports = {};
__export(client_exports, {
  TEST_ONLY: () => TEST_ONLY,
  embedContent: () => embedContent,
  generateContent: () => generateContent,
  generateContentStream: () => generateContentStream,
  getGoogleAIUrl: () => getGoogleAIUrl,
  imagenPredict: () => imagenPredict,
  listModels: () => listModels,
  veoCheckOperation: () => veoCheckOperation,
  veoPredict: () => veoPredict
});
module.exports = __toCommonJS(client_exports);
var import_utils = require("../common/utils.js");
async function listModels(apiKey, clientOptions) {
  const url = getGoogleAIUrl({
    resourcePath: "models",
    queryParams: "pageSize=1000",
    clientOptions
  });
  const fetchOptions = getFetchOptions({
    method: "GET",
    apiKey,
    clientOptions
  });
  const response = await makeRequest(url, fetchOptions);
  const modelResponse = JSON.parse(await response.text());
  return modelResponse.models;
}
async function generateContent(apiKey, model, generateContentRequest, clientOptions) {
  const url = getGoogleAIUrl({
    resourcePath: `models/${model}`,
    resourceMethod: "generateContent",
    clientOptions
  });
  const fetchOptions = getFetchOptions({
    method: "POST",
    apiKey,
    clientOptions,
    body: JSON.stringify(generateContentRequest)
  });
  const response = await makeRequest(url, fetchOptions);
  const responseJson = await response.json();
  return responseJson;
}
async function generateContentStream(apiKey, model, generateContentRequest, clientOptions) {
  const url = getGoogleAIUrl({
    resourcePath: `models/${model}`,
    resourceMethod: "streamGenerateContent",
    clientOptions
  });
  const fetchOptions = getFetchOptions({
    method: "POST",
    apiKey,
    clientOptions,
    body: JSON.stringify(generateContentRequest)
  });
  const response = await makeRequest(url, fetchOptions);
  return (0, import_utils.processStream)(response);
}
async function embedContent(apiKey, model, embedContentRequest, clientOptions) {
  const url = getGoogleAIUrl({
    resourcePath: `models/${model}`,
    resourceMethod: "embedContent",
    clientOptions
  });
  const fetchOptions = getFetchOptions({
    method: "POST",
    apiKey,
    clientOptions,
    body: JSON.stringify(embedContentRequest)
  });
  const response = await makeRequest(url, fetchOptions);
  return response.json();
}
async function imagenPredict(apiKey, model, imagenPredictRequest, clientOptions) {
  const url = getGoogleAIUrl({
    resourcePath: `models/${model}`,
    resourceMethod: "predict",
    clientOptions
  });
  const fetchOptions = getFetchOptions({
    method: "POST",
    apiKey,
    clientOptions,
    body: JSON.stringify(imagenPredictRequest)
  });
  const response = await makeRequest(url, fetchOptions);
  return response.json();
}
async function veoPredict(apiKey, model, veoPredictRequest, clientOptions) {
  const url = getGoogleAIUrl({
    resourcePath: `models/${model}`,
    resourceMethod: "predictLongRunning",
    clientOptions
  });
  const fetchOptions = getFetchOptions({
    method: "POST",
    apiKey,
    clientOptions,
    body: JSON.stringify(veoPredictRequest)
  });
  const response = await makeRequest(url, fetchOptions);
  return response.json();
}
async function veoCheckOperation(apiKey, operation, clientOptions) {
  const url = getGoogleAIUrl({
    resourcePath: operation,
    clientOptions
  });
  const fetchOptions = getFetchOptions({
    method: "GET",
    apiKey,
    clientOptions
  });
  const response = await makeRequest(url, fetchOptions);
  return response.json();
}
function getGoogleAIUrl(params) {
  const DEFAULT_API_VERSION = "v1beta";
  const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com";
  const apiVersion = params.clientOptions?.apiVersion || DEFAULT_API_VERSION;
  const baseUrl = params.clientOptions?.baseUrl || DEFAULT_BASE_URL;
  let url = `${baseUrl}/${apiVersion}/${params.resourcePath}`;
  if (params.resourceMethod) {
    url += `:${params.resourceMethod}`;
  }
  if (params.queryParams) {
    url += `?${params.queryParams}`;
  }
  if (params.resourceMethod === "streamGenerateContent") {
    url += `${params.queryParams ? "&" : "?"}alt=sse`;
  }
  return url;
}
function getFetchOptions(params) {
  const fetchOptions = {
    method: params.method,
    headers: getHeaders(params.apiKey, params.clientOptions)
  };
  if (params.body) {
    fetchOptions.body = params.body;
  }
  const signal = getAbortSignal(params.clientOptions);
  if (signal) {
    fetchOptions.signal = signal;
  }
  return fetchOptions;
}
function getAbortSignal(clientOptions) {
  const hasTimeout = (clientOptions?.timeout ?? -1) >= 0;
  if (clientOptions?.signal !== void 0 || hasTimeout) {
    const controller = new AbortController();
    if (hasTimeout) {
      setTimeout(() => controller.abort(), clientOptions?.timeout);
    }
    if (clientOptions?.signal) {
      clientOptions.signal.addEventListener("abort", () => {
        controller.abort();
      });
    }
    return controller.signal;
  }
  return void 0;
}
function getHeaders(apiKey, clientOptions) {
  let customHeaders = {};
  if (clientOptions?.customHeaders) {
    customHeaders = structuredClone(clientOptions.customHeaders);
    delete customHeaders["x-goog-api-key"];
    delete customHeaders["x-goog-api-client"];
  }
  const headers = {
    ...customHeaders,
    "Content-Type": "application/json",
    "x-goog-api-key": apiKey,
    "x-goog-api-client": (0, import_utils.getGenkitClientHeader)()
  };
  return headers;
}
async function makeRequest(url, fetchOptions) {
  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      let errorText = await response.text();
      let errorMessage = errorText;
      try {
        const json = JSON.parse(errorText);
        if (json.error && json.error.message) {
          errorMessage = json.error.message;
        }
      } catch (e) {
      }
      throw new Error(
        `Error fetching from ${url}: [${response.status} ${response.statusText}] ${errorMessage}`
      );
    }
    return response;
  } catch (e) {
    console.error(e);
    throw new Error(`Failed to fetch from ${url}: ${(0, import_utils.extractErrMsg)(e)}`);
  }
}
const TEST_ONLY = {
  getFetchOptions,
  getAbortSignal,
  getHeaders,
  makeRequest
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TEST_ONLY,
  embedContent,
  generateContent,
  generateContentStream,
  getGoogleAIUrl,
  imagenPredict,
  listModels,
  veoCheckOperation,
  veoPredict
});
//# sourceMappingURL=client.js.map