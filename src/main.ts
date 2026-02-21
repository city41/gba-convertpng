#!/usr/bin/env node

import * as path from "node:path";
import * as fsp from "fs/promises";
import {
  BackgroundSpec,
  BasicSpriteSpec,
  Format,
  ImportedJsonSpec,
  JsonSpec,
  ProcessBitmapResult,
  SharedPaletteSpriteSpec,
} from "./types";
import {
  isBasicSpriteSpec,
  isProcessBasicSpriteResult,
  isProcessSharedPaletteSpritesResult,
  isSharedPaletteSpriteSpec,
  processBasicSprite,
  ProcessBasicSpriteResult,
  processSharedPaletteSprites,
  ProcessSharedPaletteSpritesResult,
} from "./sprite";
import {
  isProcessBackgroundResult,
  processBackground,
  ProcessBackgroundResult,
} from "./background";
import { toCc, toCh, toCinc } from "./c";
import { toAsm } from "./asm";
import { isProcessBitmapResult, processBitmap } from "./bitmap";

/**
 * Loads the json spec from the file path and converts all file paths
 * inside to absolute paths so the rest of the tool doesn't have to think about it
 */
function hydrateJsonSpec(jsonSpecPath: string): JsonSpec {
  const rootDir = path.dirname(jsonSpecPath);
  const initialSpec = require(jsonSpecPath) as ImportedJsonSpec;

  return {
    ...initialSpec,
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
      };
    }),
    bitmaps: (initialSpec.bitmaps ?? []).map((bmp) => {
      return {
        ...bmp,
        file: path.resolve(rootDir, bmp.file),
      };
    }),
  };
}

type SrcFile = {
  src: string;
  extension: string;
};

type SrcFiles = {
  tile: SrcFile[];
  palette: SrcFile[];
  map: SrcFile[];
  bitmap: SrcFile[];
};

function getBitmapDefines(result: ProcessBitmapResult): string {
  const name = path.basename(
    result.bitmap.file,
    path.extname(result.bitmap.file),
  );
  return `#define ${name.toUpperCase()}_WIDTH ${result.width}
#define ${name.toUpperCase()}_HEIGHT ${result.height}`;
}

function getTileWidthHeightDefines(
  result: ProcessBasicSpriteResult | ProcessBackgroundResult,
  file: string,
): string {
  const name = path.basename(file, ".png");
  let tileWidth = result.canvas.width / 8;
  let tileHeight = result.canvas.height / 8;

  return `#define ${name.toUpperCase()}_TILE_WIDTH ${tileWidth}
#define ${name.toUpperCase()}_TILE_HEIGHT ${tileHeight}`;
}

function toSrcFiles(
  result:
    | ProcessBasicSpriteResult
    | ProcessBackgroundResult
    | ProcessSharedPaletteSpritesResult
    | ProcessBitmapResult,
  format: Format,
): SrcFiles {
  let file: string;
  if (isProcessBasicSpriteResult(result)) {
    file = result.sprite.file;
  } else if (isProcessBackgroundResult(result)) {
    file = result.background.file;
  } else if (isProcessSharedPaletteSpritesResult(result)) {
    file = result.sprite.name;
  } else if (isProcessBitmapResult(result)) {
    file = result.bitmap.file;
  } else {
    throw new Error(`toSrcFiles: unexpected object: ${JSON.stringify(result)}`);
  }

  const fileRoot = path.basename(file, path.extname(file));

  if (isProcessBitmapResult(result)) {
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
  } else if (isProcessSharedPaletteSpritesResult(result)) {
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
                getTileWidthHeightDefines(result, file),
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
                  src: toCh(result.palette, "w", fileRoot + "_palette"),
                  extension: "h",
                },
              ]
            : [],
          map:
            "background" in result
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
            "background" in result
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
            "background" in result
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
  spec: BasicSpriteSpec | BackgroundSpec | SharedPaletteSpriteSpec,
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

async function main(jsonSpec: JsonSpec) {
  if (jsonSpec.format === "bin") {
    throw new Error("convertpng does not support bin format");
  }
  for (const sprite of jsonSpec.sprites) {
    if (isBasicSpriteSpec(sprite)) {
      const processResult = await processBasicSprite(sprite);
      const srcFiles = toSrcFiles(processResult, jsonSpec.format);
      await writeFiles(srcFiles, sprite, jsonSpec.outputDir);
    } else {
      const processResult = await processSharedPaletteSprites(sprite);
      const srcFiles = toSrcFiles(processResult, jsonSpec.format);
      await writeFiles(srcFiles, processResult.sprite, jsonSpec.outputDir);

      for (const processSubResult of processResult.subsprites) {
        const srcFiles = toSrcFiles(processSubResult, jsonSpec.format);
        await writeFiles(srcFiles, processSubResult.sprite, jsonSpec.outputDir);
      }
    }
  }

  for (const bg of jsonSpec.backgrounds) {
    const processResult = await processBackground(bg);
    const srcFiles = toSrcFiles(processResult, jsonSpec.format);
    await writeFiles(srcFiles, bg, jsonSpec.outputDir);
  }

  for (const bmp of jsonSpec.bitmaps) {
    const processResult = await processBitmap(bmp);
    const srcFiles = toSrcFiles(processResult, jsonSpec.format);
    await writeFiles(srcFiles, bmp, jsonSpec.outputDir);
  }
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
