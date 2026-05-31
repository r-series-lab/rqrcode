import { readFile } from "@tauri-apps/plugin-fs";
import type { DecodeResult } from "./types";
import { normalizeUrl } from "./utils";

let qrCodeModulePromise: Promise<typeof import("qrcode")> | undefined;
let jsQrModulePromise: Promise<typeof import("jsqr")> | undefined;

async function loadQrCodeModule() {
  qrCodeModulePromise ??= import("qrcode");
  return qrCodeModulePromise;
}

async function loadJsQrModule() {
  jsQrModulePromise ??= import("jsqr");
  return jsQrModulePromise;
}

function guessMimeType(filePath: string) {
  const normalized = filePath.toLowerCase();

  if (normalized.endsWith(".png")) {
    return "image/png";
  }
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (normalized.endsWith(".webp")) {
    return "image/webp";
  }
  if (normalized.endsWith(".gif")) {
    return "image/gif";
  }
  if (normalized.endsWith(".bmp")) {
    return "image/bmp";
  }

  return "application/octet-stream";
}

export async function createQrDataUrl(content: string): Promise<string> {
  const QRCode = await loadQrCodeModule();

  return QRCode.toDataURL(content, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 420,
    color: {
      dark: "#17191d",
      light: "#fbfaf7",
    },
  });
}

async function loadImageElementFromBlob(blob: Blob): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(blob);

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("图片加载失败"));
    };
    image.src = objectUrl;
  });
}

async function decodeQrFromBlob(blob: Blob): Promise<DecodeResult> {
  const jsQR = (await loadJsQrModule()).default;
  const image = await loadImageElementFromBlob(blob);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("当前环境不支持二维码识别");
  }

  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const frame = context.getImageData(0, 0, canvas.width, canvas.height);
  const decoded = jsQR(frame.data, frame.width, frame.height, {
    inversionAttempts: "attemptBoth",
  });

  if (!decoded?.data) {
    throw new Error("没有识别到二维码，请换一张更清晰的图片再试");
  }

  return {
    content: decoded.data,
    normalizedUrl: normalizeUrl(decoded.data),
  };
}

export async function decodeQrFromFile(file: File): Promise<DecodeResult> {
  return decodeQrFromBlob(file);
}

export async function decodeQrFromPath(filePath: string): Promise<DecodeResult> {
  const fileBytes = await readFile(filePath);
  return decodeQrFromBlob(new Blob([fileBytes], { type: guessMimeType(filePath) }));
}
