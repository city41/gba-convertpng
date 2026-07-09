#!/usr/bin/env node

import * as path from "node:path";
import * as fsp from "fs/promises";
import {
  BackgroundSpec,
  BasicSpriteSpec,
  BitmapSpec,
  ExportResults,
  Format,
  ImportedJsonSpec,
  JsonSpec,
  PaletteSpec,
  ProcessBackgroundResult,
  ProcessBitmapResult,
  ProcessPaletteResult,
  ProcessResult,
  SharedPaletteSpriteSpec,
  SrcFiles,
  ToSrcFiles,
  WriteFiles,
} from "./types";
import {
  isBasicSpriteSpec,
  isSharedPaletteSpriteSpec,
  processBasicSprite,
  ProcessBasicSpriteResult,
  processSharedPaletteSprites,
  ProcessSharedPaletteSpritesResult,
} from "./sprite";
import { processBackground } from "./background";
import { toCc, toCh, toCinc } from "./c";
import { toAsm } from "./asm";
import { processBitmap } from "./bitmap";
import { processPalette } from "./palette";

function getExportResultsFunction(
  spec: ImportedJsonSpec,
  rootDir: string,
): ExportResults {
  let exportResults: ExportResults;
  if (spec.exportResultsPath) {
    exportResults = require(
      path.resolve(rootDir, spec.exportResultsPath),
    ) as ExportResults;
  } else {
    exportResults = defaultExportResults;
  }

  return exportResults;
}

/**
 * Loads the json spec from the file path and converts all file paths
 * inside to absolute paths so the rest of the tool doesn't have to think about it
 */
function hydrateJsonSpec(jsonSpecPath: string): JsonSpec {
  const rootDir = path.dirname(jsonSpecPath);
  const initialSpec = require(jsonSpecPath) as ImportedJsonSpec;

  const exportResults = getExportResultsFunction(initialSpec, rootDir);

  return {
    ...initialSpec,
    exportResults,
    outputDir: path.resolve(rootDir, initialSpec.outputDir),
    format: initialSpec.format ?? "z80",
    sprites: (initialSpec.sprites ?? []).map((s) => {
      if (isBasicSpriteSpec(s)) {
        return {
          ...s,
          file: path.resolve(rootDir, s.file),
          forcePalette: s.forcePalette
            ? path.resolve(rootDir, s.forcePalette)
            : undefined,
        };
      } else {
        return {
          ...s,
          forcePalette: s.forcePalette
            ? path.resolve(rootDir, s.forcePalette)
            : undefined,
          sharedPalette: s.sharedPalette.map((ss) => {
            return {
              ...ss,
              file: path.resolve(rootDir, ss.file),
            };
          }),
        };
      }
    }),
    backgrounds: (initialSpec.backgrounds ?? []).map((bg) => {
      return {
        ...bg,
        file: path.resolve(rootDir, bg.file),
        forcePalette: bg.forcePalette
          ? path.resolve(rootDir, bg.forcePalette)
          : undefined,
      };
    }),
    bitmaps: (initialSpec.bitmaps ?? []).map((bmp) => {
      return {
        ...bmp,
        file: path.resolve(rootDir, bmp.file),
      };
    }),
    palettes: (initialSpec.palettes ?? []).map((p) => {
      return {
        ...p,
        file: path.resolve(rootDir, p.file),
      };
    }),
  };
}

function getBitmapDefines(result: ProcessBitmapResult): string {
  const name = path.basename(result.spec.file, path.extname(result.spec.file));
  return `#define ${name.toUpperCase()}_WIDTH ${result.width}
#define ${name.toUpperCase()}_HEIGHT ${result.height}`;
}

function getPaletteDefines(
  result: ProcessBackgroundResult | ProcessBasicSpriteResult,
  file: string,
): string {
  if (result.type === "BasicSprite") {
    return "";
  }

  const name = path.basename(file, ".png");
  return `#define ${name.toUpperCase()}_NUM_PALETTES ${result.paletteCount}`;
}

function getTileDefines(
  result: ProcessBasicSpriteResult | ProcessBackgroundResult,
  file: string,
): string {
  const name = path.basename(file, ".png");
  let allFrameTileWidth = result.canvas.width / 8;
  let tileHeight = result.canvas.height / 8;

  let frameCountSrc = "";
  let frameCount = 1;

  if (result.type == "BasicSprite") {
    frameCount = result.spec.frames;
    frameCountSrc = `\n#define ${name.toUpperCase()}_FRAME_COUNT ${frameCount}`;
  }

  let singleFrameTileWidth = allFrameTileWidth / frameCount;

  if (singleFrameTileWidth != Math.floor(singleFrameTileWidth)) {
    throw new Error(
      `getTileDefines, tile width is not an integer, got: ${singleFrameTileWidth}`,
    );
  }

  return `#define ${name.toUpperCase()}_TILE_WIDTH ${singleFrameTileWidth}
#define ${name.toUpperCase()}_TILE_HEIGHT ${tileHeight}${frameCountSrc}`;
}

function toSrcFiles(
  result:
    | ProcessBasicSpriteResult
    | ProcessBackgroundResult
    | ProcessSharedPaletteSpritesResult
    | ProcessBitmapResult
    | ProcessPaletteResult,
  format: Format,
): SrcFiles {
  let file: string;
  if (result.type == "SharedPaletteSprites") {
    file = result.spec.name;
  } else {
    file = result.spec.file;
  }

  const fileRoot = path.basename(file, path.extname(file));

  if (result.type === "Bitmap") {
    switch (format) {
      case "C":
        return {
          tile: [],
          palette: [],
          map: [],
          bitmap: [
            {
              src: toCc(
                result.pixels,
                "w",
                8,
                fileRoot + "_bmp",
                fileRoot + ".bmp",
              ),
              extension: "c",
            },
            {
              src: toCh(
                result.pixels,
                "w",
                fileRoot + "_bmp",
                getBitmapDefines(result),
              ),
              extension: "h",
            },
          ],
        };
      case "C.inc":
        return {
          tile: [],
          palette: [],
          map: [],
          bitmap: [{ src: toCinc(result.pixels, "w", 8), extension: "c.inc" }],
        };
      case "asz80":
      case "z80":
      case "pyz80":
        return {
          tile: [],
          palette: [],
          map: [],
          bitmap: [
            { src: toAsm(result.pixels, "w", 8, format), extension: "asm" },
          ],
        };
      case "bin":
        throw new Error('gba-convertpng does not support "bin"');
    }
  } else if (result.type === "SharedPaletteSprites") {
    switch (format) {
      case "C":
        return {
          tile: [],
          palette: [
            {
              src: toCc(
                result.palette,
                "w",
                8,
                fileRoot + "_sharedPalette",
                fileRoot + ".shared.palette",
              ),
              extension: "c",
            },
            {
              src: toCh(result.palette, "w", fileRoot + "_sharedPalette"),
              extension: "h",
            },
          ],
          map: [],
          bitmap: [],
        };
      case "C.inc":
        return {
          tile: [],
          palette: [
            { src: toCinc(result.palette, "w", 8), extension: "c.inc" },
          ],
          map: [],
          bitmap: [],
        };
      case "asz80":
      case "z80":
      case "pyz80":
        return {
          tile: [],
          palette: [
            { src: toAsm(result.palette, "w", 8, format), extension: "asm" },
          ],
          map: [],
          bitmap: [],
        };
      case "bin":
        throw new Error('gba-convertpng does not support "bin"');
    }
  } else if (result.type === "Palette") {
    switch (format) {
      case "C":
        return {
          tile: [],
          palette: [
            {
              src: toCc(
                result.data,
                "w",
                8,
                fileRoot + "_palette",
                fileRoot + ".palette",
              ),
              extension: "c",
            },
            {
              src: toCh(result.data, "w", fileRoot + "_palette"),
              extension: "h",
            },
          ],
          map: [],
          bitmap: [],
        };
      case "C.inc":
        return {
          tile: [],
          palette: [{ src: toCinc(result.data, "w", 8), extension: "c.inc" }],
          map: [],
          bitmap: [],
        };
      case "asz80":
      case "z80":
      case "pyz80":
        return {
          tile: [],
          palette: [
            { src: toAsm(result.data, "w", 8, format), extension: "asm" },
          ],
          map: [],
          bitmap: [],
        };
      case "bin":
        throw new Error('gba-convertpng does not support "bin"');
    }
  } else {
    switch (format) {
      case "C":
        return {
          tile: [
            {
              src: toCc(
                result.tiles,
                "b",
                32,
                fileRoot + "_tiles",
                fileRoot + ".tiles",
              ),
              extension: "c",
            },
            {
              src: toCh(
                result.tiles,
                "b",
                fileRoot + "_tiles",
                getTileDefines(result, file),
              ),
              extension: "h",
            },
          ],
          palette: result.palette
            ? [
                {
                  src: toCc(
                    result.palette,
                    "w",
                    8,
                    fileRoot + "_palette",
                    fileRoot + ".palette",
                  ),
                  extension: "c",
                },
                {
                  src: toCh(
                    result.palette,
                    "w",
                    fileRoot + "_palette",
                    getPaletteDefines(result, file),
                  ),
                  extension: "h",
                },
              ]
            : [],
          map:
            result.type === "Background"
              ? [
                  {
                    src: toCc(
                      result.map,
                      "w",
                      8,
                      fileRoot + "_map",
                      fileRoot + ".map",
                    ),
                    extension: "c",
                  },
                  {
                    src: toCh(result.map, "w", fileRoot + "_map"),
                    extension: "h",
                  },
                ]
              : [],
          bitmap: [],
        };
      case "C.inc":
        return {
          tile: [{ src: toCinc(result.tiles, "b", 8), extension: "c.inc" }],
          palette: result.palette
            ? [{ src: toCinc(result.palette, "w", 8), extension: "c.inc" }]
            : [],
          map:
            result.type === "Background"
              ? [{ src: toCinc(result.map, "w", 8), extension: "c.inc" }]
              : [],
          bitmap: [],
        };
      case "asz80":
      case "z80":
      case "pyz80":
        return {
          tile: [
            { src: toAsm(result.tiles, "b", 8, format), extension: "asm" },
          ],
          palette: result.palette
            ? [{ src: toAsm(result.palette, "w", 8, format), extension: "asm" }]
            : [],
          map:
            result.type === "Background"
              ? [{ src: toAsm(result.map, "w", 8, format), extension: "asm" }]
              : [],
          bitmap: [],
        };
      case "bin":
        throw new Error('gba-convertpng does not support "bin"');
    }
  }
}

async function writeFiles(
  srcFiles: SrcFiles,
  spec:
    | BasicSpriteSpec
    | BackgroundSpec
    | SharedPaletteSpriteSpec
    | BitmapSpec
    | PaletteSpec,
  outputDir: string,
) {
  let fileRoot: string;
  if (isSharedPaletteSpriteSpec(spec)) {
    const file = spec.name;
    fileRoot = path.basename(file, path.extname(file)) + ".shared";
  } else {
    const file = spec.file;
    fileRoot = path.basename(file, path.extname(file));
  }

  for (const tileSrcFile of srcFiles.tile) {
    const tilesOutputPath = path.resolve(
      outputDir,
      `${fileRoot}.tiles.${tileSrcFile.extension}`,
    );
    await fsp.writeFile(tilesOutputPath, tileSrcFile.src);
    console.log("wrote", tilesOutputPath);
  }

  for (const paletteSrcFile of srcFiles.palette) {
    const paletteOutputPath = path.resolve(
      outputDir,
      `${fileRoot}.palette.${paletteSrcFile.extension}`,
    );
    await fsp.writeFile(paletteOutputPath, paletteSrcFile.src);
    console.log("wrote", paletteOutputPath);
  }

  for (const mapSrcFile of srcFiles.map) {
    const mapOutputPath = path.resolve(
      outputDir,
      `${fileRoot}.map.${mapSrcFile.extension}`,
    );
    await fsp.writeFile(mapOutputPath, mapSrcFile.src);
    console.log("wrote", mapOutputPath);
  }

  for (const bmpSrcFile of srcFiles.bitmap) {
    const bitmapOutputPath = path.resolve(
      outputDir,
      `${fileRoot}.bmp.${bmpSrcFile.extension}`,
    );
    await fsp.writeFile(bitmapOutputPath, bmpSrcFile.src);
    console.log("wrote", bitmapOutputPath);
  }
}

async function defaultExportResults(
  results: ProcessResult[],
  spec: JsonSpec,
  writeFiles: WriteFiles,
  toSrcFiles: ToSrcFiles,
): Promise<void> {
  for (let i = 0; i < results.length; ++i) {
    const result = results[i];
    const srcFiles = toSrcFiles(result, spec.format);
    await writeFiles(srcFiles, result.spec, spec.outputDir);

    if (result.type === "SharedPaletteSprites") {
      for (const processSubResult of result.subsprites) {
        const srcFiles = toSrcFiles(processSubResult, spec.format);
        await writeFiles(srcFiles, processSubResult.spec, spec.outputDir);
      }
    }
  }
}

async function main(jsonSpec: JsonSpec) {
  if (jsonSpec.format === "bin") {
    throw new Error("convertpng does not support bin format");
  }
  const results: ProcessResult[] = [];

  for (const sprite of jsonSpec.sprites) {
    if (isBasicSpriteSpec(sprite)) {
      const processResult = await processBasicSprite(sprite);
      results.push(processResult);
    } else {
      const processResult = await processSharedPaletteSprites(sprite);
      results.push(processResult);
    }
  }

  for (const bg of jsonSpec.backgrounds) {
    const processResult = await processBackground(bg);
    results.push(processResult);
  }

  for (const bmp of jsonSpec.bitmaps) {
    const processResult = await processBitmap(bmp);
    results.push(processResult);
  }
  for (const palette of jsonSpec.palettes) {
    const processResult = await processPalette(palette);
    results.push(processResult);
  }

  jsonSpec.exportResults(results, jsonSpec, writeFiles, toSrcFiles);
}

if (require.main === module) {
  const [_tsNode, _convertpng, jsonSpecPath] = process.argv;

  if (!jsonSpecPath) {
    console.error("usage: gba-convertpng <json-spec-path>");
    process.exit(1);
  }

  const jsonSpec = hydrateJsonSpec(path.resolve(jsonSpecPath));

  main(jsonSpec)
    .then(() => console.log("done"))
    .catch((e) => console.error(e));
}
