import { createCanvasFromPath } from "./canvas";
import { rgbToGBA15 } from "./colors";
import { BitmapSpec, ProcessBitmapResult } from "./types";

function isProcessBitmapResult(obj: unknown): obj is ProcessBitmapResult {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "bitmap" in obj &&
    typeof obj.bitmap === "object" &&
    obj.bitmap !== null &&
    "file" in obj.bitmap
  );
}

async function processBitmap(bmp: BitmapSpec): Promise<ProcessBitmapResult> {
  const canvas = await createCanvasFromPath(bmp.file);
  const context = canvas.getContext("2d")!;
  const imageData = context.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  ).data;

  const pixels: number[] = [];

  for (let p = 0; p < imageData.length; p += 4) {
    const gbaColor = rgbToGBA15(
      imageData[p],
      imageData[p + 1],
      imageData[p + 2],
    );
    pixels.push(gbaColor);
  }

  return {
    bitmap: bmp,
    width: canvas.width,
    height: canvas.height,
    pixels,
  };
}

export { processBitmap, isProcessBitmapResult };
