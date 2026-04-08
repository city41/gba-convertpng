import * as path from "node:path";
import * as os from "node:os";
import * as fsp from "node:fs/promises";
import { Canvas, createCanvas, Image } from "canvas";
import magick from "imagemagick";
import { mkdirp } from "mkdirp";
import nearestColor from "nearest-color";

async function _reduceColorsWithMagick(
  renderedFilePath: string,
  maxColors: number,
): Promise<string> {
  const outputPath = `${renderedFilePath}.reduced.png`;

  return new Promise((resolve, reject) => {
    magick.convert(
      [
        renderedFilePath,
        "-dither",
        "none",
        "-colors",
        maxColors.toString(),
        `png8:${outputPath}`,
      ],
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(outputPath);
        }
      },
    );
  });
}

async function reduceColors(c: Canvas, maxColors: number): Promise<Canvas> {
  const tmpDir = path.resolve(os.tmpdir(), `reduceColors_${Date.now()}`);
  await mkdirp(tmpDir);
  const tmpPath = path.resolve(
    tmpDir,
    `_reduceColors_${maxColors}_${Date.now()}.png`,
  );
  const b = c.toBuffer();

  await fsp.writeFile(tmpPath, b);
  const reducedPath = await _reduceColorsWithMagick(tmpPath, maxColors);

  return createCanvasFromPath(reducedPath);
}

async function createCanvasFromPath(pngPath: string): Promise<Canvas> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = createCanvas(img.width, img.height);
      const context = canvas.getContext("2d");
      context.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = reject;

    img.src = pngPath;
  });
}

type RGB = {
  r: number;
  g: number;
  b: number;
};

type ColorSpec = {
  name?: string;
  source: string;
  rgb: RGB;
};

type ColorMatch = {
  /**
   * The name of the matched color, e.g., 'red'
   */
  name: string;
  /**
   * The hex-based color string, e.g., '#FF0'
   */
  value: string;
  /**
   * The {@link RGB} color values.
   */
  rgb: RGB;

  distance: number;
};

function findNearestColor(
  pixel: Uint8ClampedArray,
  palette: Uint8ClampedArray,
): Uint8ClampedArray {
  const colorsInput: ColorSpec[] = [];

  for (let p = 0; p < palette.length; p += 4) {
    colorsInput.push({
      name: `color${p / 4}`,
      source: "",
      rgb: {
        r: palette[p],
        g: palette[p + 1],
        b: palette[p + 2],
      },
    });
  }

  const pixelInput = {
    r: pixel[0],
    g: pixel[1],
    b: pixel[2],
  };

  const nearestResult = nearestColor(pixelInput, colorsInput);

  const nearestPixel = new Array(4);
  nearestPixel[0] = (nearestResult as ColorMatch).rgb.r;
  nearestPixel[1] = (nearestResult as ColorMatch).rgb.g;
  nearestPixel[2] = (nearestResult as ColorMatch).rgb.b;
  nearestPixel[3] = 255;

  return Uint8ClampedArray.from(nearestPixel);
}

function isMagenta(pixel: Uint8ClampedArray): boolean {
  return pixel[0] === 255 && pixel[1] === 0 && pixel[2] === 255;
}

async function forceCanvasToPalette(
  canvas: Canvas,
  palette: Canvas,
): Promise<Canvas> {
  if (palette.width !== 15) {
    throw new Error(
      `forceCanvasToPalette: palette needs to be 15px wide (got ${palette.width}, it should not have zero/magenta in it)`,
    );
  }

  if (palette.height !== 1) {
    throw new Error("forceCanvasToPalette: palette needs to be 1px tall");
  }

  const canvasImageData = canvas
    .getContext("2d")
    .getImageData(0, 0, canvas.width, canvas.height);

  const paletteImageData = palette
    .getContext("2d")
    .getImageData(0, 0, palette.width, palette.height);

  for (let p = 0; p < canvasImageData.data.length; p += 4) {
    const pixel = canvasImageData.data.slice(p, p + 4);
    if (isMagenta(pixel) || pixel[3] !== 255) {
      continue;
    }
    const nearestPixel = findNearestColor(pixel, paletteImageData.data);
    canvasImageData.data.set(nearestPixel, p);
  }

  canvas.getContext("2d").putImageData(canvasImageData, 0, 0);

  return canvas;
}

// given an input canvas, returns it with additional pixels to
// the left and bottom such that the canvas size is a multiple of 8
function roundUpToTileSize(canvas: Canvas): Canvas {
  const roundedCanvas = createCanvas(
    Math.ceil(canvas.width / 8) * 8,
    Math.ceil(canvas.height / 8) * 8,
  );
  const context = roundedCanvas.getContext("2d")!;

  context.drawImage(canvas, 0, 0);

  return roundedCanvas;
}

export {
  createCanvasFromPath,
  reduceColors,
  forceCanvasToPalette,
  roundUpToTileSize,
};
