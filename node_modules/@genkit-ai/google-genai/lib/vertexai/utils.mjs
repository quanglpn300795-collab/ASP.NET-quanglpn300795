import { GenkitError } from "genkit";
import { GoogleAuth } from "google-auth-library";
import {
  checkModelName,
  checkSupportedMimeType,
  cleanSchema,
  extractMedia,
  extractMimeType,
  extractText,
  extractVersion,
  modelName
} from "../common/utils.js";
const CLOUD_PLATFORM_OAUTH_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
function parseFirebaseProjectId() {
  if (!process.env.FIREBASE_CONFIG) return void 0;
  try {
    return JSON.parse(process.env.FIREBASE_CONFIG).projectId;
  } catch {
    return void 0;
  }
}
let __mockDerivedOptions = void 0;
function setMockDerivedOptions(options) {
  __mockDerivedOptions = options;
}
const TEST_ONLY = { setMockDerivedOptions };
async function getDerivedOptions(options, AuthClass = GoogleAuth) {
  if (__mockDerivedOptions) {
    return Promise.resolve(__mockDerivedOptions);
  }
  if (options?.location == "global") {
    return await getGlobalDerivedOptions(AuthClass, options);
  } else if (options?.location) {
    return await getRegionalDerivedOptions(AuthClass, options);
  } else if (options?.apiKey !== void 0) {
    return getExpressDerivedOptions(options);
  }
  try {
    const regionalOptions = await getRegionalDerivedOptions(AuthClass, options);
    return regionalOptions;
  } catch (e) {
  }
  try {
    const globalOptions = await getGlobalDerivedOptions(AuthClass, options);
    return globalOptions;
  } catch (e) {
  }
  try {
    const expressOptions = getExpressDerivedOptions(options);
    return expressOptions;
  } catch (e) {
  }
  throw new GenkitError({
    status: "INVALID_ARGUMENT",
    message: "Unable to determine client options. Please set either apiKey or projectId and location"
  });
}
async function getGlobalDerivedOptions(AuthClass, options) {
  let authOptions = options?.googleAuth;
  let authClient;
  const providedProjectId = options?.projectId || process.env.GCLOUD_PROJECT || parseFirebaseProjectId();
  if (process.env.GCLOUD_SERVICE_ACCOUNT_CREDS) {
    const serviceAccountCreds = JSON.parse(
      process.env.GCLOUD_SERVICE_ACCOUNT_CREDS
    );
    authOptions = {
      credentials: serviceAccountCreds,
      scopes: [CLOUD_PLATFORM_OAUTH_SCOPE],
      projectId: providedProjectId
    };
    authClient = new AuthClass(authOptions);
  } else {
    authClient = new AuthClass(
      authOptions ?? {
        scopes: [CLOUD_PLATFORM_OAUTH_SCOPE],
        projectId: providedProjectId
      }
    );
  }
  const projectId = options?.projectId || process.env.GCLOUD_PROJECT || await authClient.getProjectId();
  if (!projectId) {
    throw new Error(
      `VertexAI Plugin is missing the 'project' configuration. Please set the 'GCLOUD_PROJECT' environment variable or explicitly pass 'project' into genkit config.`
    );
  }
  const clientOpt = {
    kind: "global",
    location: "global",
    projectId,
    authClient
  };
  if (options?.apiKey) {
    clientOpt.apiKey = options.apiKey;
  }
  return clientOpt;
}
function getExpressDerivedOptions(options) {
  const apiKey = checkApiKey(options?.apiKey);
  return {
    kind: "express",
    apiKey
  };
}
async function getRegionalDerivedOptions(AuthClass, options) {
  let authOptions = options?.googleAuth;
  let authClient;
  const providedProjectId = options?.projectId || process.env.GCLOUD_PROJECT || parseFirebaseProjectId();
  if (process.env.GCLOUD_SERVICE_ACCOUNT_CREDS) {
    const serviceAccountCreds = JSON.parse(
      process.env.GCLOUD_SERVICE_ACCOUNT_CREDS
    );
    authOptions = {
      credentials: serviceAccountCreds,
      scopes: [CLOUD_PLATFORM_OAUTH_SCOPE],
      projectId: providedProjectId
    };
    authClient = new AuthClass(authOptions);
  } else {
    authClient = new AuthClass(
      authOptions ?? {
        scopes: [CLOUD_PLATFORM_OAUTH_SCOPE],
        projectId: providedProjectId
      }
    );
  }
  const projectId = options?.projectId || process.env.GCLOUD_PROJECT || await authClient.getProjectId();
  const location = options?.location || process.env.GCLOUD_LOCATION || "us-central1";
  if (!location) {
    throw new Error(
      `VertexAI Plugin is missing the 'location' configuration. Please set the 'GCLOUD_LOCATION' environment variable or explicitly pass 'location' into genkit config.`
    );
  }
  if (!projectId) {
    throw new Error(
      `VertexAI Plugin is missing the 'project' configuration. Please set the 'GCLOUD_PROJECT' environment variable or explicitly pass 'project' into genkit config.`
    );
  }
  const clientOpt = {
    kind: "regional",
    location,
    projectId,
    authClient
  };
  if (options?.apiKey) {
    clientOpt.apiKey = options.apiKey;
  }
  return clientOpt;
}
function getApiKeyFromEnvVar() {
  return process.env.VERTEX_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
}
const MISSING_API_KEY_ERROR = new GenkitError({
  status: "FAILED_PRECONDITION",
  message: "Please pass in the API key or set the VERTEX_API_KEY or GOOGLE_API_KEY environment variable.\nFor more details see https://firebase.google.com/docs/genkit/plugins/google-genai"
});
const API_KEY_FALSE_ERROR = new GenkitError({
  status: "INVALID_ARGUMENT",
  message: "VertexAI plugin was initialized with {apiKey: false} but no apiKey configuration was passed at call time."
});
const NOT_SUPPORTED_IN_EXPRESS_ERROR = new GenkitError({
  status: "PERMISSION_DENIED",
  message: "This method or model is not supported in Vertex AI Express Mode.\nFor more details see https://cloud.google.com/vertex-ai/generative-ai/docs/start/express-mode/vertex-ai-express-mode-api-reference"
});
function checkApiKey(pluginApiKey) {
  let apiKey;
  if (pluginApiKey !== false) {
    apiKey = pluginApiKey || getApiKeyFromEnvVar();
  }
  if (pluginApiKey !== false && !apiKey) {
    throw MISSING_API_KEY_ERROR;
  }
  return apiKey;
}
function calculateApiKey(pluginApiKey, requestApiKey) {
  let apiKey;
  if (pluginApiKey !== false) {
    apiKey = pluginApiKey || getApiKeyFromEnvVar();
  }
  apiKey = requestApiKey || apiKey;
  if (pluginApiKey === false && !requestApiKey) {
    throw API_KEY_FALSE_ERROR;
  }
  if (!apiKey) {
    throw MISSING_API_KEY_ERROR;
  }
  return apiKey;
}
function checkSupportedResourceMethod(params) {
  if (params.resourcePath == "") {
    return;
  }
  const supportedExpressMethods = [
    "countTokens",
    "generateContent",
    "streamGenerateContent"
  ];
  if (params.clientOptions.kind === "express" && (!supportedExpressMethods.includes(params.resourceMethod ?? "") || params.resourcePath?.includes("endpoints/"))) {
    throw NOT_SUPPORTED_IN_EXPRESS_ERROR;
  }
}
export {
  API_KEY_FALSE_ERROR,
  MISSING_API_KEY_ERROR,
  NOT_SUPPORTED_IN_EXPRESS_ERROR,
  TEST_ONLY,
  calculateApiKey,
  checkApiKey,
  checkModelName,
  checkSupportedMimeType,
  checkSupportedResourceMethod,
  cleanSchema,
  extractMedia,
  extractMimeType,
  extractText,
  extractVersion,
  getApiKeyFromEnvVar,
  getDerivedOptions,
  modelName
};
//# sourceMappingURL=utils.mjs.map