import { toAsm } from "./asm";
import { createCanvasFromPath, reduceColors } from "./canvas";
import { extractPalette } from "./palette";
import { BackgroundSpec, Format } from "./types";
import { dedupeTiles, extractTiles } from "./tile";
import isEqual from "lodash/isEqual";
import { toC } from "./c";

type ProcessBackgroundResult = {
  tilesAsmSrc: string;
  paletteAsmSrc: string;
  mapAsmSrc: string;
};

function extractMap(
  allTilesThatFormImage: number[][],
  dedupedTiles: number[][]
): number[] {
  const map: number[] = [];

  allTilesThatFormImage.forEach((tile, i) => {
    const index = dedupedTiles.findIndex((dt) => {
      return isEqual(dt, tile);
    });

    if (index < 0) {
      throw new Error(
        "extractMap: failed to find a matching tile in the deduped tile set"
      );
    }

    map.push(index);
  });

  return map;
}

async function processBackground(
  bg: BackgroundSpec,
  format: Format
): Promise<ProcessBackgroundResult> {
  const canvas = await reduceColors(await createCanvasFromPath(bg.file), 16);

  const palette = extractPalette(canvas, !bg.trimPalette);

  const allTilesThatFormImage = extractTiles(canvas, palette, 1);
  const dedupedTiles = dedupeTiles(allTilesThatFormImage);

  const map = extractMap(allTilesThatFormImage, dedupedTiles);

  const toSrcFun = format === "C" ? toC : toAsm;

  return {
    tilesAsmSrc: toSrcFun(dedupedTiles.flat(1), "b", 4, format),
    paletteAsmSrc: toSrcFun(palette, "w", 4, format),
    mapAsmSrc: toSrcFun(map, "w", 8, format),
  };
}

export { processBackground };
