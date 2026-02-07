import { createCanvasFromPath, reduceColors } from "./canvas";
import { extractPalette } from "./palette";
import { BackgroundSpec, ProcessBackgroundResult } from "./types";
import { dedupeTiles, extractTiles } from "./tile";
import isEqual from "lodash/isEqual";

function isProcessBackgroundResult(
  obj: unknown,
): obj is ProcessBackgroundResult {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "background" in obj &&
    typeof obj.background === "object" &&
    obj.background !== null &&
    "file" in obj.background
  );
}

function extractMap(
  allTilesThatFormImage: number[][],
  dedupedTiles: number[][],
): number[] {
  const map: number[] = [];

  allTilesThatFormImage.forEach((tile, i) => {
    const index = dedupedTiles.findIndex((dt) => {
      return isEqual(dt, tile);
    });

    if (index < 0) {
      throw new Error(
        "extractMap: failed to find a matching tile in the deduped tile set",
      );
    }

    map.push(index);
  });

  return map;
}

async function processBackground(
  bg: BackgroundSpec,
): Promise<ProcessBackgroundResult> {
  const canvas = await reduceColors(await createCanvasFromPath(bg.file), 16);

  const palette = extractPalette(canvas, !bg.trimPalette);

  const allTilesThatFormImage = extractTiles(canvas, palette, 1);
  const dedupedTiles = dedupeTiles(allTilesThatFormImage);

  const map = extractMap(allTilesThatFormImage, dedupedTiles);

  if (typeof bg.transparentColor === "number") {
    palette[0] = bg.transparentColor;
  }

  return {
    background: bg,
    tiles: dedupedTiles.flat(1),
    palette,
    map,
  };
}

export { processBackground, isProcessBackgroundResult };
export type { ProcessBackgroundResult };
