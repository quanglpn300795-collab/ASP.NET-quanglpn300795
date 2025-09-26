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
var converters_exports = {};
__export(converters_exports, {
  fromImagenResponse: () => fromImagenResponse,
  fromLyriaResponse: () => fromLyriaResponse,
  fromVeoOperation: () => fromVeoOperation,
  toGeminiLabels: () => toGeminiLabels,
  toGeminiSafetySettings: () => toGeminiSafetySettings,
  toImagenPredictRequest: () => toImagenPredictRequest,
  toLyriaPredictRequest: () => toLyriaPredictRequest,
  toVeoMedia: () => toVeoMedia,
  toVeoModel: () => toVeoModel,
  toVeoOperationRequest: () => toVeoOperationRequest,
  toVeoPredictRequest: () => toVeoPredictRequest
});
module.exports = __toCommonJS(converters_exports);
var import_genkit = require("genkit");
var import_model = require("genkit/model");
var import_utils = require("./utils.js");
function toGeminiSafetySettings(genkitSettings) {
  if (!genkitSettings) return void 0;
  return genkitSettings.map((s) => {
    return {
      category: s.category,
      threshold: s.threshold
    };
  });
}
function toGeminiLabels(labels) {
  if (!labels) {
    return void 0;
  }
  const keys = Object.keys(labels);
  const newLabels = {};
  for (const key of keys) {
    const value = labels[key];
    if (!key) {
      continue;
    }
    newLabels[key] = value;
  }
  if (Object.keys(newLabels).length == 0) {
    return void 0;
  }
  return newLabels;
}
function toImagenPredictRequest(request) {
  return {
    instances: toImagenInstances(request),
    parameters: toImagenParameters(request)
  };
}
function toImagenInstances(request) {
  let instance = {
    prompt: (0, import_utils.extractText)(request)
  };
  const imageMedia = (0, import_utils.extractMedia)(request, {
    metadataType: "image",
    isDefault: true
  });
  if (imageMedia) {
    const image = imageMedia.url.split(",")[1];
    instance.image = {
      bytesBase64Encoded: image
    };
  }
  const maskMedia = (0, import_utils.extractMedia)(request, { metadataType: "mask" });
  if (maskMedia) {
    const mask = maskMedia.url.split(",")[1];
    instance.mask = {
      image: {
        bytesBase64Encoded: mask
      }
    };
  }
  return [instance];
}
function toImagenParameters(request) {
  const params = {
    sampleCount: request.candidates ?? 1,
    ...request?.config
  };
  for (const k in params) {
    if (!params[k]) delete params[k];
  }
  return params;
}
function fromImagenPrediction(p, i) {
  const b64data = p.bytesBase64Encoded;
  const mimeType = p.mimeType;
  return {
    index: i,
    finishReason: "stop",
    message: {
      role: "model",
      content: [
        {
          media: {
            url: `data:${mimeType};base64,${b64data}`,
            contentType: mimeType
          }
        }
      ]
    }
  };
}
function fromImagenResponse(response, request) {
  const candidates = response.predictions.map(fromImagenPrediction);
  return {
    candidates,
    usage: {
      ...(0, import_model.getBasicUsageStats)(request.messages, candidates),
      custom: { generations: candidates.length }
    },
    custom: response
  };
}
function toLyriaPredictRequest(request) {
  return {
    instances: toLyriaInstances(request),
    parameters: toLyriaParameters(request)
  };
}
function toLyriaInstances(request) {
  let config = { ...request.config };
  delete config.sampleCount;
  return [
    {
      prompt: (0, import_utils.extractText)(request),
      ...config
    }
  ];
}
function toLyriaParameters(request) {
  return {
    sampleCount: request.config?.sampleCount || 1
  };
}
function fromLyriaPrediction(p, i) {
  const b64data = p.bytesBase64Encoded;
  const mimeType = p.mimeType;
  return {
    index: i,
    finishReason: "stop",
    message: {
      role: "model",
      content: [
        {
          media: {
            url: `data:${mimeType};base64,${b64data}`,
            contentType: mimeType
          }
        }
      ]
    }
  };
}
function fromLyriaResponse(response, request) {
  const candidates = response.predictions.map(fromLyriaPrediction);
  return {
    candidates,
    usage: {
      ...(0, import_model.getBasicUsageStats)(request.messages, candidates),
      custom: { generations: candidates.length }
    },
    custom: response
  };
}
function toVeoPredictRequest(request) {
  return {
    instances: toVeoInstances(request),
    parameters: { ...request.config }
  };
}
function toVeoInstances(request) {
  let instance = {
    prompt: (0, import_utils.extractText)(request)
  };
  const supportedImageTypes = ["image/jpeg", "image/png"];
  const supportedVideoTypes = ["video/mp4"];
  const imageMedia = (0, import_utils.extractMedia)(request, { metadataType: "image" });
  if (imageMedia) {
    (0, import_utils.checkSupportedMimeType)(imageMedia, supportedImageTypes);
    instance.image = toVeoMedia(imageMedia);
  }
  const lastFrameMedia = (0, import_utils.extractMedia)(request, { metadataType: "lastFrame" });
  if (lastFrameMedia) {
    (0, import_utils.checkSupportedMimeType)(lastFrameMedia, supportedImageTypes);
    instance.lastFrame = toVeoMedia(lastFrameMedia);
  }
  const videoMedia = (0, import_utils.extractMedia)(request, { metadataType: "video" });
  if (videoMedia) {
    (0, import_utils.checkSupportedMimeType)(videoMedia, supportedVideoTypes);
    instance.video = toVeoMedia(videoMedia);
  }
  return [instance];
}
function toVeoMedia(media) {
  let mimeType = media.contentType;
  if (!mimeType) {
    mimeType = (0, import_utils.extractMimeType)(media.url);
    if (!mimeType) {
      throw new import_genkit.GenkitError({
        status: "INVALID_ARGUMENT",
        message: "Content type is required."
      });
    }
  }
  if (media.url.startsWith("data:")) {
    return {
      bytesBase64Encoded: media.url?.split(",")[1],
      mimeType
    };
  } else if (media.url.startsWith("gs://")) {
    return {
      gcsUri: media.url,
      mimeType
    };
  } else if (media.url.startsWith("http")) {
    throw new import_genkit.GenkitError({
      status: "INVALID_ARGUMENT",
      message: "Veo does not support http(s) URIs. Please specify a Cloud Storage URI."
    });
  } else {
    return {
      bytesBase64Encoded: media.url,
      mimeType
    };
  }
}
function fromVeoOperation(fromOp) {
  const toOp = { id: fromOp.name };
  if (fromOp.done !== void 0) {
    toOp.done = fromOp.done;
  }
  if (fromOp.error) {
    toOp.error = { message: fromOp.error.message };
  }
  if (fromOp.response) {
    toOp.output = {
      finishReason: "stop",
      raw: fromOp.response,
      message: {
        role: "model",
        content: fromOp.response.videos.map((veoMedia) => {
          if (veoMedia.bytesBase64Encoded) {
            return {
              media: {
                url: `data:${veoMedia.mimeType}:base64,${veoMedia.bytesBase64Encoded}`,
                contentType: veoMedia.mimeType
              }
            };
          }
          return {
            media: {
              url: veoMedia.gcsUri ?? "",
              contentType: veoMedia.mimeType
            }
          };
        })
      }
    };
  }
  return toOp;
}
function toVeoModel(op) {
  return op.id.substring(
    op.id.indexOf("models/") + 7,
    op.id.indexOf("/operations/")
  );
}
function toVeoOperationRequest(op) {
  return {
    operationName: op.id
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  fromImagenResponse,
  fromLyriaResponse,
  fromVeoOperation,
  toGeminiLabels,
  toGeminiSafetySettings,
  toImagenPredictRequest,
  toLyriaPredictRequest,
  toVeoMedia,
  toVeoModel,
  toVeoOperationRequest,
  toVeoPredictRequest
});
//# sourceMappingURL=converters.js.map