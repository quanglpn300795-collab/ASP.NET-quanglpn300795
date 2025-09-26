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
var utils_exports = {};
__export(utils_exports, {
  checkModelName: () => checkModelName,
  checkSupportedMimeType: () => checkSupportedMimeType,
  cleanSchema: () => cleanSchema,
  displayUrl: () => displayUrl,
  extractErrMsg: () => extractErrMsg,
  extractMedia: () => extractMedia,
  extractMimeType: () => extractMimeType,
  extractText: () => extractText,
  extractVersion: () => extractVersion,
  getGenkitClientHeader: () => getGenkitClientHeader,
  modelName: () => modelName,
  processStream: () => processStream
});
module.exports = __toCommonJS(utils_exports);
var import_genkit = require("genkit");
var import_types = require("./types.js");
function extractErrMsg(e) {
  let errorMessage = "An unknown error occurred";
  if (e instanceof Error) {
    errorMessage = e.message;
  } else if (typeof e === "string") {
    errorMessage = e;
  } else {
    try {
      errorMessage = JSON.stringify(e);
    } catch (stringifyError) {
      errorMessage = "Failed to stringify error object";
    }
  }
  return errorMessage;
}
function extractVersion(model) {
  return model.version ? model.version : checkModelName(model.name);
}
function modelName(name) {
  if (!name) return name;
  const prefixesToRemove = /background-model\/|model\/|models\/|embedders\/|googleai\/|vertexai\//g;
  return name.replace(prefixesToRemove, "");
}
function checkModelName(name) {
  const version = modelName(name);
  if (!version) {
    throw new import_genkit.GenkitError({
      status: "INVALID_ARGUMENT",
      message: "Model name is required."
    });
  }
  return version;
}
function extractText(request) {
  return request.messages.at(-1)?.content.map((c) => c.text || "").join("") ?? "";
}
const KNOWN_MIME_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  mp4: "video/mp4",
  pdf: "application/pdf"
};
function extractMimeType(url) {
  if (!url) {
    return "";
  }
  const dataPrefix = "data:";
  if (!url.startsWith(dataPrefix)) {
    url.lastIndexOf(".");
    const key = url.substring(url.lastIndexOf(".") + 1);
    if (Object.keys(KNOWN_MIME_TYPES).includes(key)) {
      return KNOWN_MIME_TYPES[key];
    }
    return "";
  }
  const commaIndex = url.indexOf(",");
  if (commaIndex == -1) {
    return "";
  }
  let mimeType = url.substring(dataPrefix.length, commaIndex);
  const base64Marker = ";base64";
  if (mimeType.endsWith(base64Marker)) {
    mimeType = mimeType.substring(0, mimeType.length - base64Marker.length);
  }
  return mimeType.trim();
}
function checkSupportedMimeType(media, supportedTypes) {
  if (!supportedTypes.includes(media.contentType ?? "")) {
    throw new import_genkit.GenkitError({
      status: "INVALID_ARGUMENT",
      message: `Invalid mimeType for ${displayUrl(media.url)}: "${media.contentType}". Supported mimeTypes: ${supportedTypes.join(", ")}`
    });
  }
}
function displayUrl(url) {
  if (url.length <= 50) {
    return url;
  }
  return url.substring(0, 25) + "..." + url.substring(url.length - 25);
}
function extractMedia(request, params) {
  const predicate = (part) => {
    const media2 = part.media;
    if (!media2) {
      return false;
    }
    if (params.metadataType || params.isDefault) {
      const metadata = part.metadata;
      if (!metadata?.type) {
        return !!params.isDefault;
      } else {
        return metadata.type == params.metadataType;
      }
    }
    return true;
  };
  const media = request.messages.at(-1)?.content.find(predicate)?.media;
  if (media && !media?.contentType) {
    return {
      url: media.url,
      contentType: extractMimeType(media.url)
    };
  }
  return media;
}
function cleanSchema(schema) {
  const out = structuredClone(schema);
  for (const key in out) {
    if (key === "$schema" || key === "additionalProperties") {
      delete out[key];
      continue;
    }
    if (typeof out[key] === "object") {
      out[key] = cleanSchema(out[key]);
    }
    if (key === "type" && Array.isArray(out[key])) {
      out[key] = out[key].find((t) => t !== "null");
    }
  }
  return out;
}
function processStream(response) {
  if (!response.body) {
    throw new Error("Error processing stream because response.body not found");
  }
  const inputStream = response.body.pipeThrough(
    new TextDecoderStream("utf8", { fatal: true })
  );
  const responseStream = getResponseStream(inputStream);
  const [stream1, stream2] = responseStream.tee();
  return {
    stream: generateResponseSequence(stream1),
    response: getResponsePromise(stream2)
  };
}
function getResponseStream(inputStream) {
  const responseLineRE = /^data: (.*)(?:\n\n|\r\r|\r\n\r\n)/;
  const reader = inputStream.getReader();
  const stream = new ReadableStream({
    start(controller) {
      let currentText = "";
      return pump();
      function pump() {
        return reader.read().then(({ value, done }) => {
          if (done) {
            if (currentText.trim()) {
              controller.error(new Error("Failed to parse stream"));
              return;
            }
            controller.close();
            return;
          }
          currentText += value;
          let match = currentText.match(responseLineRE);
          let parsedResponse;
          while (match) {
            try {
              parsedResponse = JSON.parse(match[1]);
            } catch (e) {
              controller.error(
                new Error(`Error parsing JSON response: "${match[1]}"`)
              );
              return;
            }
            controller.enqueue(parsedResponse);
            currentText = currentText.substring(match[0].length);
            match = currentText.match(responseLineRE);
          }
          return pump();
        }).catch((e) => {
          let err = e;
          err.stack = e.stack;
          if (err.name === "AbortError") {
            err = new import_genkit.GenkitError({
              status: "ABORTED",
              message: "Request aborted when reading from the stream"
            });
          } else {
            err = new Error("Error reading from the stream");
          }
          throw err;
        });
      }
    }
  });
  return stream;
}
async function* generateResponseSequence(stream) {
  const reader = stream.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    yield value;
  }
}
async function getResponsePromise(stream) {
  const allResponses = [];
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      return aggregateResponses(allResponses);
    }
    allResponses.push(value);
  }
}
function aggregateResponses(responses) {
  const lastResponse = responses.at(-1);
  if (lastResponse === void 0) {
    throw new Error(
      "Error aggregating stream chunks because the final response in stream chunk is undefined"
    );
  }
  const aggregatedResponse = {};
  if (lastResponse.promptFeedback) {
    aggregatedResponse.promptFeedback = lastResponse.promptFeedback;
  }
  for (const response of responses) {
    for (const candidate of response.candidates ?? []) {
      const index = candidate.index ?? 0;
      if (!aggregatedResponse.candidates) {
        aggregatedResponse.candidates = [];
      }
      if (!aggregatedResponse.candidates[index]) {
        aggregatedResponse.candidates[index] = {
          index
        };
      }
      const aggregatedCandidate = aggregatedResponse.candidates[index];
      aggregateMetadata(aggregatedCandidate, candidate, "citationMetadata");
      aggregateMetadata(aggregatedCandidate, candidate, "groundingMetadata");
      if (candidate.safetyRatings?.length) {
        aggregatedCandidate.safetyRatings = (aggregatedCandidate.safetyRatings ?? []).concat(candidate.safetyRatings);
      }
      if (candidate.finishReason !== void 0) {
        aggregatedCandidate.finishReason = candidate.finishReason;
      }
      if (candidate.finishMessage !== void 0) {
        aggregatedCandidate.finishMessage = candidate.finishMessage;
      }
      if (candidate.avgLogprobs !== void 0) {
        aggregatedCandidate.avgLogprobs = candidate.avgLogprobs;
      }
      if (candidate.logprobsResult !== void 0) {
        aggregatedCandidate.logprobsResult = candidate.logprobsResult;
      }
      if (candidate.content && candidate.content.parts) {
        if (!aggregatedCandidate.content) {
          aggregatedCandidate.content = {
            role: candidate.content.role || "user",
            parts: []
          };
        }
        for (const part of candidate.content.parts) {
          const newPart = {};
          if (part.thought) {
            newPart.thought = part.thought;
          }
          if (part.text) {
            newPart.text = part.text;
          }
          if (part.functionCall) {
            newPart.functionCall = part.functionCall;
          }
          if (part.executableCode) {
            newPart.executableCode = part.executableCode;
          }
          if (part.codeExecutionResult) {
            newPart.codeExecutionResult = part.codeExecutionResult;
          }
          if (Object.keys(newPart).length === 0) {
            newPart.text = "";
          }
          aggregatedCandidate.content.parts.push(newPart);
        }
      }
    }
    if (response.usageMetadata) {
      aggregatedResponse.usageMetadata = response.usageMetadata;
    }
  }
  return aggregatedResponse;
}
function aggregateMetadata(aggCandidate, chunkCandidate, fieldName) {
  const chunkObj = chunkCandidate[fieldName];
  const aggObj = aggCandidate[fieldName];
  if (chunkObj === void 0) return;
  if (aggObj === void 0) {
    aggCandidate[fieldName] = chunkObj;
    return;
  }
  if ((0, import_types.isObject)(chunkObj)) {
    for (const k of Object.keys(chunkObj)) {
      if (Array.isArray(aggObj[k]) && Array.isArray(chunkObj[k])) {
        aggObj[k] = aggObj[k].concat(chunkObj[k]);
      } else {
        aggObj[k] = chunkObj[k] ?? aggObj[k];
      }
    }
  }
}
function getGenkitClientHeader() {
  if (process.env.MONOSPACE_ENV == "true") {
    return (0, import_genkit.getClientHeader)() + " firebase-studio-vm";
  }
  return (0, import_genkit.getClientHeader)();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  checkModelName,
  checkSupportedMimeType,
  cleanSchema,
  displayUrl,
  extractErrMsg,
  extractMedia,
  extractMimeType,
  extractText,
  extractVersion,
  getGenkitClientHeader,
  modelName,
  processStream
});
//# sourceMappingURL=utils.js.map