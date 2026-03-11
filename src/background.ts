import {
  createCanvasFromPath,
  forceCanvasToPalette,
  reduceColors,
  roundUpToTileSize,
} from "./canvas";
import { BackgroundSpec, ProcessBackgroundResult } from "./types";
import { rgbToGBA15 } from "./colors";
import { sortBy } from "lodash";
import { extractPalette15, getForcedPalette, MAGENTA_15 } from "./palette";

type MapEntry = {
  tileIndex: number;
  paletteIndex: number;
};

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

function convertTileTo15Bit(rawTile: number[]): number[] {
  const data15: number[] = [];

  for (let p = 0; p < rawTile.length; p += 4) {
    if (rawTile[p + 3] !== 255) {
      data15.push(MAGENTA_15);
    } else {
      data15.push(rgbToGBA15(rawTile[p], rawTile[p + 1], rawTile[p + 2]));
    }
  }

  return data15;
}

function getTileIndex(tilePalette: number[][], tile: number[]): number {
  const index = tilePalette.findIndex((t) => {
    return t.join("-") === tile.join("-");
  });

  if (index > -1) {
    return index;
  }
  tilePalette.push([...tile]);
  return tilePalette.length - 1;
}

// looks through all the palettes and combines multiple palettes into one
// based on how much room they have.
// example, palette-a has 4 colors, palette-b has 6, result is a palette with 10 colors
// possibly the two palettes share colors, only one copy of each color will be preserved
//
// by the way this algoritm works, it also uniqs the palettes
function combinePalettes(palettes: number[][]): number[][] {
  if (palettes.length <= 1) {
    return palettes;
  }

  const sortedPalettes = sortBy(palettes, (p) => p.length);

  let firstPalette = sortedPalettes[0];
  const remainingPalettes: number[][] = [];

  for (let p = 1; p < sortedPalettes.length; ++p) {
    const otherPalette = sortedPalettes[p];
    const otherPaletteUniqueColors = otherPalette.filter(
      (c) => !firstPalette.includes(c),
    );
    if (firstPalette.length + otherPaletteUniqueColors.length < 16) {
      firstPalette = firstPalette.concat(otherPaletteUniqueColors);
    } else {
      remainingPalettes.push(otherPalette);
    }
  }

  const combinedOtherPalettes = combinePalettes(remainingPalettes);

  return [firstPalette].concat(combinedOtherPalettes);
}

function buildMap(
  tiles: MapEntry[],
  bgWidthPx: number,
  bgHeightPx: number,
): number[] {
  const map: number[] = [];
  const bgWidthT = bgWidthPx / 8;
  const bgHeightT = bgHeightPx / 8;

  for (let y = 0; y < bgHeightT; ++y) {
    for (let x = 0; x < bgWidthT; ++x) {
      const tile = tiles[y * bgWidthT + x];
      map.push((tile.paletteIndex << 12) | tile.tileIndex);
    }
  }
  return map;
}

function getGBATile(data15: number[], palette: number[]): number[] {
  const gbaTile: number[] = [];

  for (let p = 0; p < data15.length; p += 2) {
    const highNibble = palette.indexOf(data15[p + 1]);
    const lowNibble = palette.indexOf(data15[p]);
    const byte = ((highNibble & 0xf) << 4) | (lowNibble & 0xf);

    gbaTile.push(byte);
  }
  return gbaTile;
}

function findMatchingPalette(data15: number[], palettes: number[][]): number[] {
  const foundPalette = palettes.find((palette) => {
    return data15.every((c) => palette.includes(c));
  });

  if (!foundPalette) {
    throw new Error("findMatchingPalette: failed to find a palette");
  }

  return foundPalette;
}

function padPalette(palette: number[]): number[] {
  while (palette.length < 16) {
    palette.push(0);
  }
  return palette;
}

async function processBackground(
  bg: BackgroundSpec,
): Promise<ProcessBackgroundResult> {
  let canvas = await createCanvasFromPath(bg.file);

  if (typeof bg.reduceColors === "undefined" || bg.reduceColors === true) {
    canvas = await reduceColors(canvas, 16);
  }

  canvas = roundUpToTileSize(canvas);

  const ctx = canvas.getContext("2d")!;

  const tiles: MapEntry[] = [];
  const tilePalette: number[][] = [];
  let palettes: number[][] = [];

  // first, determine the palettes
  if (bg.forcePalette) {
    const forcedPaletteCanvas = await createCanvasFromPath(bg.forcePalette);
    canvas = await forceCanvasToPalette(canvas, forcedPaletteCanvas);
    palettes.push(getForcedPalette(forcedPaletteCanvas));
  } else {
    for (let y = 0; y < canvas.height; y += 8) {
      for (let x = 0; x < canvas.width; x += 8) {
        const rawTile = Array.from(ctx.getImageData(x, y, 8, 8).data);
        const data15 = convertTileTo15Bit(rawTile);
        const palette = extractPalette15(data15, false);
        palettes = combinePalettes(palettes.concat([palette]));
      }
    }
  }

  // now with palettes in hand, do the rest
  for (let y = 0; y < canvas.height; y += 8) {
    for (let x = 0; x < canvas.width; x += 8) {
      const rawTile = Array.from(ctx.getImageData(x, y, 8, 8).data);
      const data15 = convertTileTo15Bit(rawTile);
      const palette = findMatchingPalette(data15, palettes);
      const gbaTileData = getGBATile(data15, palette);
      const tileIndex = getTileIndex(tilePalette, gbaTileData);
      const paletteIndex = palettes.indexOf(palette);
      tiles.push({
        tileIndex,
        paletteIndex,
      });
    }
  }

  const tileData = tilePalette.flat(1);
  const paletteData = palettes.map(padPalette).flat(1);
  const paletteCount = palettes.length;
  const map = buildMap(tiles, canvas.width, canvas.height);

  if (typeof bg.transparentColor === "number") {
    paletteData[0] = bg.transparentColor;
  }

  return {
    background: bg,
    canvas,
    map,
    palette: paletteData,
    paletteCount,
    tiles: tileData,
  };
}

export { processBackground, isProcessBackgroundResult };
