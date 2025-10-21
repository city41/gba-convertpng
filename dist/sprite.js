"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBasicSpriteSpec = isBasicSpriteSpec;
exports.processSprite = processSprite;
const asm_1 = require("./asm");
const c_1 = require("./c");
const canvas_1 = require("./canvas");
const palette_1 = require("./palette");
const tile_1 = require("./tile");
function isBasicSpriteSpec(sprite) {
    return "file" in sprite;
}
async function processBasicSprite(sprite, format, forcedPalette) {
    let canvas = await (0, canvas_1.reduceColors)(await (0, canvas_1.createCanvasFromPath)(sprite.file), 16);
    let palette;
    if (forcedPalette) {
        canvas = await (0, canvas_1.forceCanvasToPalette)(canvas, forcedPalette);
        palette = (0, palette_1.extractPalette)(forcedPalette, false);
    }
    else {
        palette = (0, palette_1.extractPalette)(canvas, !sprite.trimPalette);
    }
    const tiles = (0, tile_1.extractTiles)(canvas, palette, sprite.frames).flat(1);
    if (format === "bin") {
        return {
            canvas,
            tilesSrc: tiles,
            paletteSrc: palette,
        };
    }
    const tileSrcFun = format === "z80" ? asm_1.toAsm : c_1.toC;
    const paletteSrcFun = format === "z80" ? asm_1.toAsm : c_1.toC;
    return {
        canvas,
        tilesSrc: [tileSrcFun(tiles, "b", 4)],
        paletteSrc: paletteSrcFun(palette, "w", 4),
    };
}
async function processSharedPaletteSprites(sharedPaletteSprite, format, forcedPalette) {
    const canvases = [];
    const palettes = [];
    for (let i = 0; i < sharedPaletteSprite.sharedPalette.length; ++i) {
        let c = await (0, canvas_1.reduceColors)(await (0, canvas_1.createCanvasFromPath)(sharedPaletteSprite.sharedPalette[i].file), 16);
        if (forcedPalette) {
            c = await (0, canvas_1.forceCanvasToPalette)(c, forcedPalette);
        }
        canvases.push(c);
        palettes.push((0, palette_1.extractPalette)(c, !sharedPaletteSprite.trimPalette));
    }
    const commonPalette = forcedPalette
        ? (0, palette_1.extractPalette)(forcedPalette, false)
        : (0, palette_1.reducePalettes)(palettes);
    const tiles = [];
    for (let i = 0; i < sharedPaletteSprite.sharedPalette.length; ++i) {
        const t = (0, tile_1.extractTiles)(canvases[i], commonPalette, sharedPaletteSprite.sharedPalette[i].frames).flat(1);
        tiles.push(t);
    }
    const tileSrcFun = format === "z80" ? asm_1.toAsm : c_1.toC;
    const paletteSrcFun = format === "z80" ? asm_1.toAsm : c_1.toC;
    return {
        // this is useless in this scenario, but canvas
        // really only exists for the puzzle generator
        canvas: canvases[0],
        tilesSrc: tiles.map((t) => tileSrcFun(t, "b", 4)),
        paletteSrc: paletteSrcFun(commonPalette, "w", 4),
    };
}
async function processSprite(sprite, format, forcedPalettePath) {
    const forcedPalette = forcedPalettePath
        ? await (0, canvas_1.createCanvasFromPath)(forcedPalettePath)
        : undefined;
    if (isBasicSpriteSpec(sprite)) {
        return processBasicSprite(sprite, format, forcedPalette);
    }
    else {
        return processSharedPaletteSprites(sprite, format, forcedPalette);
    }
}
//# sourceMappingURL=sprite.js.map