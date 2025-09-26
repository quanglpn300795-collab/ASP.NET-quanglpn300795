import {
  GenkitError
} from "genkit";
import { getBasicUsageStats } from "genkit/model";
import {
  checkSupportedMimeType,
  extractMedia,
  extractMimeType,
  extractText
} from "./utils.js";
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
    prompt: extractText(request)
  };
  const imageMedia = extractMedia(request, {
    metadataType: "image",
    isDefault: true
  });
  if (imageMedia) {
    const image = imageMedia.url.split(",")[1];
    instance.image = {
      bytesBase64Encoded: image
    };
  }
  const maskMedia = extractMedia(request, { metadataType: "mask" });
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
      ...getBasicUsageStats(request.messages, candidates),
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
      prompt: extractText(request),
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
      ...getBasicUsageStats(request.messages, candidates),
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
    prompt: extractText(request)
  };
  const supportedImageTypes = ["image/jpeg", "image/png"];
  const supportedVideoTypes = ["video/mp4"];
  const imageMedia = extractMedia(request, { metadataType: "image" });
  if (imageMedia) {
    checkSupportedMimeType(imageMedia, supportedImageTypes);
    instance.image = toVeoMedia(imageMedia);
  }
  const lastFrameMedia = extractMedia(request, { metadataType: "lastFrame" });
  if (lastFrameMedia) {
    checkSupportedMimeType(lastFrameMedia, supportedImageTypes);
    instance.lastFrame = toVeoMedia(lastFrameMedia);
  }
  const videoMedia = extractMedia(request, { metadataType: "video" });
  if (videoMedia) {
    checkSupportedMimeType(videoMedia, supportedVideoTypes);
    instance.video = toVeoMedia(videoMedia);
  }
  return [instance];
}
function toVeoMedia(media) {
  let mimeType = media.contentType;
  if (!mimeType) {
    mimeType = extractMimeType(media.url);
    if (!mimeType) {
      throw new GenkitError({
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
    throw new GenkitError({
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
export {
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
};
//# sourceMappingURL=converters.mjs.map