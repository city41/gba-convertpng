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
const formatToExt = {
    C: "c.inc",
    asz80: "asm",
    z80: "asm",
    pyz80: "asm",
    bin: "bin",
};
async function main(jsonSpec) {
    if (jsonSpec.format === "bin") {
        throw new Error("convertpng does not support bin format");
    }
    const ext = formatToExt[jsonSpec.format];
    for (const sprite of jsonSpec.sprites) {
        const processResult = await (0, sprite_1.processSprite)(sprite, jsonSpec.format, sprite.forcePalette);
        if ((0, sprite_1.isBasicSpriteSpec)(sprite)) {
            const fileRoot = path.basename(sprite.file, path.extname(sprite.file));
            const tilesOutputPath = path.resolve(jsonSpec.outputDir, `${fileRoot}.tiles.${ext}`);
            const paletteOutputPath = path.resolve(jsonSpec.outputDir, `${fileRoot}.palette.${ext}`);
            await fsp.writeFile(tilesOutputPath, processResult.tilesSrc[0]);
            console.log("wrote", tilesOutputPath);
            await fsp.writeFile(paletteOutputPath, processResult.paletteSrc);
            console.log("wrote", paletteOutputPath);
        }
        else {
            for (let i = 0; i < sprite.sharedPalette.length; ++i) {
                const subsprite = sprite.sharedPalette[i];
                const fileRoot = path.basename(subsprite.file, path.extname(subsprite.file));
                const tilesOutputPath = path.resolve(jsonSpec.outputDir, `${fileRoot}.tiles.${ext}`);
                await fsp.writeFile(tilesOutputPath, processResult.tilesSrc[i]);
                console.log("wrote", tilesOutputPath);
            }
            const paletteOutputPath = path.resolve(jsonSpec.outputDir, `${sprite.name}.shared.palette.${ext}`);
            await fsp.writeFile(paletteOutputPath, processResult.paletteSrc);
            console.log("wrote", paletteOutputPath);
        }
    }
    for (const bg of jsonSpec.backgrounds) {
        const processResult = await (0, background_1.processBackground)(bg, jsonSpec.format);
        const fileRoot = path.basename(bg.file, path.extname(bg.file));
        const tilesAsmPath = path.resolve(jsonSpec.outputDir, `${fileRoot}.tiles.asm`);
        const paletteAsmPath = path.resolve(jsonSpec.outputDir, `${fileRoot}.palette.asm`);
        const mapAsmPath = path.resolve(jsonSpec.outputDir, `${fileRoot}.map.asm`);
        await fsp.writeFile(tilesAsmPath, processResult.tilesAsmSrc);
        console.log("wrote", tilesAsmPath);
        await fsp.writeFile(paletteAsmPath, processResult.paletteAsmSrc);
        console.log("wrote", paletteAsmPath);
        await fsp.writeFile(mapAsmPath, processResult.mapAsmSrc);
        console.log("wrote", mapAsmPath);
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