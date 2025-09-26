import {
  extractErrMsg,
  getGenkitClientHeader,
  processStream
} from "../common/utils.js";
import { calculateApiKey, checkSupportedResourceMethod } from "./utils.js";
async function listModels(clientOptions) {
  const url = getVertexAIUrl({
    includeProjectAndLocation: false,
    resourcePath: "publishers/google/models",
    clientOptions
  });
  const fetchOptions = await getFetchOptions({
    method: "GET",
    clientOptions
  });
  const response = await makeRequest(url, fetchOptions);
  const modelResponse = await response.json();
  return modelResponse.publisherModels;
}
async function generateContent(model, generateContentRequest, clientOptions) {
  let url;
  if (model.includes("endpoints/")) {
    url = getVertexAIUrl({
      includeProjectAndLocation: !model.startsWith("projects/"),
      resourcePath: model,
      resourceMethod: "generateContent",
      clientOptions
    });
  } else {
    url = getVertexAIUrl({
      includeProjectAndLocation: true,
      resourcePath: `publishers/google/models/${model}`,
      resourceMethod: "generateContent",
      clientOptions
    });
  }
  const fetchOptions = await getFetchOptions({
    method: "POST",
    clientOptions,
    body: JSON.stringify(generateContentRequest)
  });
  const response = await makeRequest(url, fetchOptions);
  const responseJson = await response.json();
  return responseJson;
}
async function generateContentStream(model, generateContentRequest, clientOptions) {
  let url;
  if (model.includes("endpoints/")) {
    url = getVertexAIUrl({
      includeProjectAndLocation: !model.startsWith("projects/"),
      resourcePath: model,
      resourceMethod: "streamGenerateContent",
      clientOptions
    });
  } else {
    url = getVertexAIUrl({
      includeProjectAndLocation: true,
      resourcePath: `publishers/google/models/${model}`,
      resourceMethod: "streamGenerateContent",
      clientOptions
    });
  }
  const fetchOptions = await getFetchOptions({
    method: "POST",
    clientOptions,
    body: JSON.stringify(generateContentRequest)
  });
  const response = await makeRequest(url, fetchOptions);
  return processStream(response);
}
async function internalPredict(model, body, clientOptions) {
  const url = getVertexAIUrl({
    includeProjectAndLocation: true,
    resourcePath: `publishers/google/models/${model}`,
    resourceMethod: "predict",
    clientOptions
  });
  const fetchOptions = await getFetchOptions({
    method: "POST",
    clientOptions,
    body
  });
  return await makeRequest(url, fetchOptions);
}
async function embedContent(model, embedContentRequest, clientOptions) {
  const response = await internalPredict(
    model,
    JSON.stringify(embedContentRequest),
    clientOptions
  );
  return response.json();
}
async function imagenPredict(model, imagenPredictRequest, clientOptions) {
  const response = await internalPredict(
    model,
    JSON.stringify(imagenPredictRequest),
    clientOptions
  );
  return response.json();
}
async function lyriaPredict(model, lyriaPredictRequest, clientOptions) {
  const response = await internalPredict(
    model,
    JSON.stringify(lyriaPredictRequest),
    clientOptions
  );
  return response.json();
}
async function veoPredict(model, veoPredictRequest, clientOptions) {
  const url = getVertexAIUrl({
    includeProjectAndLocation: true,
    resourcePath: `publishers/google/models/${model}`,
    resourceMethod: "predictLongRunning",
    clientOptions
  });
  const fetchOptions = await getFetchOptions({
    method: "POST",
    clientOptions,
    body: JSON.stringify(veoPredictRequest)
  });
  const response = await makeRequest(url, fetchOptions);
  return response.json();
}
async function veoCheckOperation(model, veoOperationRequest, clientOptions) {
  const url = getVertexAIUrl({
    includeProjectAndLocation: true,
    resourcePath: `publishers/google/models/${model}`,
    resourceMethod: "fetchPredictOperation",
    clientOptions
  });
  const fetchOptions = await getFetchOptions({
    method: "POST",
    clientOptions,
    body: JSON.stringify(veoOperationRequest)
  });
  const response = await makeRequest(url, fetchOptions);
  return response.json();
}
function getVertexAIUrl(params) {
  checkSupportedResourceMethod(params);
  const DEFAULT_API_VERSION = "v1beta1";
  const API_BASE_PATH = "aiplatform.googleapis.com";
  let basePath;
  if (params.clientOptions.kind == "regional") {
    basePath = `${params.clientOptions.location}-${API_BASE_PATH}`;
  } else {
    basePath = API_BASE_PATH;
  }
  let resourcePath = params.resourcePath;
  if (params.clientOptions.kind != "express" && params.includeProjectAndLocation) {
    const parent = `projects/${params.clientOptions.projectId}/locations/${params.clientOptions.location}`;
    resourcePath = `${parent}/${params.resourcePath}`;
  }
  let url = `https://${basePath}/${DEFAULT_API_VERSION}/${resourcePath}`;
  if (params.resourceMethod) {
    url += `:${params.resourceMethod}`;
  }
  let joiner = "?";
  if (params.queryParams) {
    url += `${joiner}${params.queryParams}`;
    joiner = "&";
  }
  if (params.resourceMethod === "streamGenerateContent") {
    url += `${joiner}alt=sse`;
    joiner = "&";
  }
  return url;
}
async function getFetchOptions(params) {
  const fetchOptions = {
    method: params.method,
    headers: await getHeaders(params.clientOptions)
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
  const hasTimeout = (clientOptions.timeout ?? -1) >= 0;
  if (clientOptions.signal !== void 0 || hasTimeout) {
    const controller = new AbortController();
    if (hasTimeout) {
      setTimeout(() => controller.abort(), clientOptions.timeout);
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
async function getHeaders(clientOptions) {
  if (clientOptions.kind == "express") {
    const headers = {
      "x-goog-api-key": calculateApiKey(clientOptions.apiKey, void 0),
      "Content-Type": "application/json",
      "X-Goog-Api-Client": getGenkitClientHeader(),
      "User-Agent": getGenkitClientHeader()
    };
    return headers;
  } else {
    const token = await getToken(clientOptions.authClient);
    const headers = {
      Authorization: `Bearer ${token}`,
      "x-goog-user-project": clientOptions.projectId,
      "Content-Type": "application/json",
      "X-Goog-Api-Client": getGenkitClientHeader(),
      "User-Agent": getGenkitClientHeader()
    };
    if (clientOptions.apiKey) {
      headers["x-goog-api-key"] = clientOptions.apiKey;
    }
    return headers;
  }
}
async function getToken(authClient) {
  const CREDENTIAL_ERROR_MESSAGE = "\nUnable to authenticate your request        \nDepending on your run time environment, you can get authentication by        \n- if in local instance or cloud shell: `!gcloud auth login`        \n- if in Colab:        \n    -`from google.colab import auth`        \n    -`auth.authenticate_user()`        \n- if in service account or other: please follow guidance in https://cloud.google.com/docs/authentication";
  const token = await authClient.getAccessToken().catch((e) => {
    throw new Error(CREDENTIAL_ERROR_MESSAGE, e);
  });
  if (!token) {
    throw new Error(CREDENTIAL_ERROR_MESSAGE);
  }
  return token;
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
    throw new Error(`Failed to fetch from ${url}: ${extractErrMsg(e)}`);
  }
}
const TEST_ONLY = {
  getFetchOptions,
  getAbortSignal,
  getHeaders,
  makeRequest
};
export {
  TEST_ONLY,
  embedContent,
  generateContent,
  generateContentStream,
  getVertexAIUrl,
  imagenPredict,
  listModels,
  lyriaPredict,
  veoCheckOperation,
  veoPredict
};
//# sourceMappingURL=client.mjs.map