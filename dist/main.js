#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("node:path"));
const fsp = __importStar(require("fs/promises"));
const sprite_1 = require("./sprite");
const background_1 = require("./background");
const c_1 = require("./c");
const asm_1 = require("./asm");
/**
 * Loads the json spec from the file path and converts all file paths
 * inside to absolute paths so the rest of the tool doesn't have to think about it
 */
function hydrateJsonSpec(jsonSpecPath) {
    const rootDir = path.dirname(jsonSpecPath);
    const initialSpec = require(jsonSpecPath);
    return {
        ...initialSpec,
        outputDir: path.resolve(rootDir, initialSpec.outputDir),
        format: initialSpec.format ?? "z80",
        sprites: (initialSpec.sprites ?? []).map((s) => {
            if ((0, sprite_1.isBasicSpriteSpec)(s)) {
                return {
                    ...s,
                    file: path.resolve(rootDir, s.file),
                    forcePalette: s.forcePalette
                        ? path.resolve(rootDir, s.forcePalette)
                        : undefined,
                };
            }
            else {
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
    };
}
function toSrcFiles(result, format) {
    let file;
    if ((0, sprite_1.isProcessBasicSpriteResult)(result)) {
        file = result.sprite.file;
    }
    else if ((0, background_1.isProcessBackgroundResult)(result)) {
        file = result.background.file;
    }
    else if ((0, sprite_1.isProcessSharedPaletteSpritesResult)(result)) {
        file = result.sprite.name;
    }
    else {
        throw new Error(`toSrcFiles: unexpected object: ${JSON.stringify(result)}`);
    }
    const fileRoot = path.basename(file, path.extname(file));
    if ((0, sprite_1.isProcessSharedPaletteSpritesResult)(result)) {
        switch (format) {
            case "C":
                return {
                    tile: [],
                    palette: [
                        {
                            src: (0, c_1.toCc)(result.palette, "w", 8, fileRoot + "_sharedPalette", fileRoot + ".shared.palette"),
                            extension: "c",
                        },
                        {
                            src: (0, c_1.toCh)(result.palette, "w", fileRoot + "_sharedPalette"),
                            extension: "h",
                        },
                    ],
                    map: [],
                };
            case "C.inc":
                return {
                    tile: [],
                    palette: [
                        { src: (0, c_1.toCinc)(result.palette, "w", 8), extension: "c.inc" },
                    ],
                    map: [],
                };
            case "asz80":
            case "z80":
            case "pyz80":
                return {
                    tile: [],
                    palette: [
                        { src: (0, asm_1.toAsm)(result.palette, "w", 8, format), extension: "asm" },
                    ],
                    map: [],
                };
            case "bin":
                throw new Error('gba-convertpng does not support "bin"');
        }
    }
    else {
        switch (format) {
            case "C":
                return {
                    tile: [
                        {
                            src: (0, c_1.toCc)(result.tiles, "b", 32, fileRoot + "_tiles", fileRoot + ".tiles"),
                            extension: "c",
                        },
                        {
                            src: (0, c_1.toCh)(result.tiles, "b", fileRoot + "_tiles"),
                            extension: "h",
                        },
                    ],
                    palette: result.palette
                        ? [
                            {
                                src: (0, c_1.toCc)(result.palette, "w", 8, fileRoot + "_palette", fileRoot + ".palette"),
                                extension: "c",
                            },
                            {
                                src: (0, c_1.toCh)(result.palette, "w", fileRoot + "_palette"),
                                extension: "h",
                            },
                        ]
                        : [],
                    map: "background" in result
                        ? [
                            {
                                src: (0, c_1.toCc)(result.map, "w", 8, fileRoot + "_map", fileRoot + ".map"),
                                extension: "c",
                            },
                            {
                                src: (0, c_1.toCh)(result.map, "w", fileRoot + "_map"),
                                extension: "h",
                            },
                        ]
                        : [],
                };
            case "C.inc":
                return {
                    tile: [{ src: (0, c_1.toCinc)(result.tiles, "b", 8), extension: "c.inc" }],
                    palette: result.palette
                        ? [{ src: (0, c_1.toCinc)(result.palette, "w", 8), extension: "c.inc" }]
                        : [],
                    map: "background" in result
                        ? [{ src: (0, c_1.toCinc)(result.map, "w", 8), extension: "c.inc" }]
                        : [],
                };
            case "asz80":
            case "z80":
            case "pyz80":
                return {
                    tile: [
                        { src: (0, asm_1.toAsm)(result.tiles, "b", 8, format), extension: "asm" },
                    ],
                    palette: result.palette
                        ? [{ src: (0, asm_1.toAsm)(result.palette, "w", 8, format), extension: "asm" }]
                        : [],
                    map: "background" in result
                        ? [{ src: (0, asm_1.toAsm)(result.map, "w", 8, format), extension: "asm" }]
                        : [],
                };
            case "bin":
                throw new Error('gba-convertpng does not support "bin"');
        }
    }
}
async function writeFiles(srcFiles, spec, outputDir) {
    let fileRoot;
    if ((0, sprite_1.isSharedPaletteSpriteSpec)(spec)) {
        const file = spec.name;
        fileRoot = path.basename(file, path.extname(file)) + ".shared";
    }
    else {
        const file = spec.file;
        fileRoot = path.basename(file, path.extname(file));
    }
    for (const tileSrcFile of srcFiles.tile) {
        const tilesOutputPath = path.resolve(outputDir, `${fileRoot}.tiles.${tileSrcFile.extension}`);
        await fsp.writeFile(tilesOutputPath, tileSrcFile.src);
        console.log("wrote", tilesOutputPath);
    }
    for (const paletteSrcFile of srcFiles.palette) {
        const paletteOutputPath = path.resolve(outputDir, `${fileRoot}.palette.${paletteSrcFile.extension}`);
        await fsp.writeFile(paletteOutputPath, paletteSrcFile.src);
        console.log("wrote", paletteOutputPath);
    }
    for (const mapSrcFile of srcFiles.map) {
        const mapOutputPath = path.resolve(outputDir, `${fileRoot}.map.${mapSrcFile.extension}`);
        await fsp.writeFile(mapOutputPath, mapSrcFile.src);
        console.log("wrote", mapOutputPath);
    }
}
async function main(jsonSpec) {
    if (jsonSpec.format === "bin") {
        throw new Error("convertpng does not support bin format");
    }
    for (const sprite of jsonSpec.sprites) {
        if ((0, sprite_1.isBasicSpriteSpec)(sprite)) {
            const processResult = await (0, sprite_1.processBasicSprite)(sprite);
            const srcFiles = toSrcFiles(processResult, jsonSpec.format);
            await writeFiles(srcFiles, sprite, jsonSpec.outputDir);
        }
        else {
            const processResult = await (0, sprite_1.processSharedPaletteSprites)(sprite);
            const srcFiles = toSrcFiles(processResult, jsonSpec.format);
            await writeFiles(srcFiles, processResult.sprite, jsonSpec.outputDir);
            for (const processSubResult of processResult.subsprites) {
                const srcFiles = toSrcFiles(processSubResult, jsonSpec.format);
                await writeFiles(srcFiles, processSubResult.sprite, jsonSpec.outputDir);
            }
        }
    }
    for (const bg of jsonSpec.backgrounds) {
        const processResult = await (0, background_1.processBackground)(bg);
        const srcFiles = toSrcFiles(processResult, jsonSpec.format);
        await writeFiles(srcFiles, bg, jsonSpec.outputDir);
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
//# sourceMappingURL=main.js.map