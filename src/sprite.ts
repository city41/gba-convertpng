import {
  createCanvasFromPath,
  forceCanvasToPalette,
  reduceColors,
} from "./canvas";
import {
  BasicSpriteSpec,
  ProcessBasicSpriteResult,
  ProcessSharedPaletteSpritesResult,
  SharedPaletteSpriteSpec,
  SpriteSpec,
} from "./types";
import { extractPalette, getForcedPalette, reduceCanvases } from "./palette";
import { extractTiles } from "./tile";
import { Canvas } from "canvas";

function isSharedPaletteSpriteSpec(
  obj: unknown,
): obj is SharedPaletteSpriteSpec {
  return typeof obj === "object" && obj !== null && "name" in obj;
}

function isProcessBasicSpriteResult(
  obj: unknown,
): obj is ProcessBasicSpriteResult {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "sprite" in obj &&
    typeof obj.sprite === "object" &&
    obj.sprite !== null &&
    "file" in obj.sprite
  );
}

function isProcessSharedPaletteSpritesResult(
  obj: unknown,
): obj is ProcessSharedPaletteSpritesResult {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "sprite" in obj &&
    isSharedPaletteSpriteSpec(obj.sprite)
  );
}

function isBasicSpriteSpec(sprite: SpriteSpec): sprite is BasicSpriteSpec {
  return "file" in sprite;
}

async function processBasicSprite(
  sprite: BasicSpriteSpec,
  forcedPaletteOverride?: Canvas,
): Promise<ProcessBasicSpriteResult> {
  if (sprite.frames === undefined || sprite.frames === 0) {
    throw new Error(`sprite, ${sprite.file}, has no frames defined`);
  }
  let canvas = await reduceColors(await createCanvasFromPath(sprite.file), 16);

  let palette: number[];
  if (forcedPaletteOverride || sprite.forcePalette) {
    const forcedPaletteCanvas =
      forcedPaletteOverride ??
      (await createCanvasFromPath(sprite.forcePalette!));
    canvas = await forceCanvasToPalette(canvas, forcedPaletteCanvas);
    palette = getForcedPalette(forcedPaletteCanvas);
  } else {
    palette = extractPalette(canvas, !sprite.trimPalette);
  }

  const tiles = extractTiles(canvas, palette, sprite.frames).flat(1);

  if (typeof sprite.transparentColor === "number") {
    palette[0] = sprite.transparentColor;
  }

  return {
    sprite,
    canvas,
    tiles,
    palette,
  };
}

async function processSharedPaletteSprites(
  sharedPaletteSprite: SharedPaletteSpriteSpec,
): Promise<ProcessSharedPaletteSpritesResult> {
  if (
    sharedPaletteSprite.name === undefined ||
    sharedPaletteSprite.name.trim() === ""
  ) {
    throw new Error("sharedPaletteSprite lacks a name");
  }
  const subsprites: BasicSpriteSpec[] = [];
  const canvases: Canvas[] = [];

  const forcedPalette = sharedPaletteSprite.forcePalette
    ? await createCanvasFromPath(sharedPaletteSprite.forcePalette)
    : undefined;

  for (let i = 0; i < sharedPaletteSprite.sharedPalette.length; ++i) {
    let c = await reduceColors(
      await createCanvasFromPath(sharedPaletteSprite.sharedPalette[i].file),
      16,
    );
    if (forcedPalette) {
      c = await forceCanvasToPalette(c, forcedPalette);
    }
    canvases.push(c);
    subsprites.push(sharedPaletteSprite.sharedPalette[i]);
  }

  const { palette: commonPalette, canvas: forcedPaletteCanvas } = forcedPalette
    ? {
        palette: extractPalette(forcedPalette, false),
        canvas: forcedPalette,
      }
    : reduceCanvases(canvases);

  if (!forcedPalette && !sharedPaletteSprite.trimPalette) {
    while (commonPalette.length < 16) {
      commonPalette.push(0);
    }
  }

  const subspriteResults: ProcessBasicSpriteResult[] = [];

  for (const subsprite of subsprites) {
    const subspriteResult = await processBasicSprite(
      subsprite,
      forcedPaletteCanvas,
    );
    const { palette, ...subspriteResultWithoutPalette } = subspriteResult;
    subspriteResults.push(subspriteResultWithoutPalette);
  }

  if (typeof sharedPaletteSprite.transparentColor === "number") {
    commonPalette[0] = sharedPaletteSprite.transparentColor;
  }

  return {
    sprite: sharedPaletteSprite,
    palette: commonPalette,
    subsprites: subspriteResults,
  };
}

export {
  isBasicSpriteSpec,
  processBasicSprite,
  processSharedPaletteSprites,
  isSharedPaletteSpriteSpec,
  isProcessBasicSpriteResult,
  isProcessSharedPaletteSpritesResult,
};
export type { ProcessBasicSpriteResult, ProcessSharedPaletteSpritesResult };
