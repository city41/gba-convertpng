"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBasicSpriteSpec = isBasicSpriteSpec;
exports.isSharedPaletteSpriteSpec = isSharedPaletteSpriteSpec;
exports.processBasicSprite = processBasicSprite;
exports.processSharedPaletteSprites = processSharedPaletteSprites;
const canvas_1 = require("./canvas");
const palette_1 = require("./palette");
const tile_1 = require("./tile");
function isSharedPaletteSpriteSpec(obj) {
    return typeof obj === "object" && obj !== null && "name" in obj;
}
function isBasicSpriteSpec(sprite) {
    return "file" in sprite;
}
async function processBasicSprite(sprite, forcedPaletteOverride) {
    if (sprite.frames === undefined || sprite.frames === 0) {
        throw new Error(`sprite, ${sprite.file}, has no frames defined`);
    }
    let canvas = await (0, canvas_1.reduceColors)(await (0, canvas_1.createCanvasFromPath)(sprite.file), 16);
    canvas = (0, canvas_1.roundUpToTileSize)(canvas);
    let palette;
    if (forcedPaletteOverride || sprite.forcePalette) {
        const forcedPaletteCanvas = forcedPaletteOverride ??
            (await (0, canvas_1.createCanvasFromPath)(sprite.forcePalette));
        canvas = await (0, canvas_1.forceCanvasToPalette)(canvas, forcedPaletteCanvas);
        palette = (0, palette_1.getForcedPalette)(forcedPaletteCanvas);
    }
    else {
        palette = (0, palette_1.extractPalette)(canvas, !sprite.trimPalette);
    }
    const tiles = (0, tile_1.extractTiles)(canvas, palette, sprite.frames).flat(1);
    if (typeof sprite.transparentColor === "number") {
        palette[0] = sprite.transparentColor;
    }
    return {
        type: "BasicSprite",
        spec: sprite,
        canvas,
        tiles,
        palette,
    };
}
async function processSharedPaletteSprites(sharedPaletteSprite) {
    if (sharedPaletteSprite.name === undefined ||
        sharedPaletteSprite.name.trim() === "") {
        throw new Error("sharedPaletteSprite lacks a name");
    }
    const subsprites = [];
    const canvases = [];
    const forcedPalette = sharedPaletteSprite.forcePalette
        ? await (0, canvas_1.createCanvasFromPath)(sharedPaletteSprite.forcePalette)
        : undefined;
    for (let i = 0; i < sharedPaletteSprite.sharedPalette.length; ++i) {
        let c = await (0, canvas_1.reduceColors)(await (0, canvas_1.createCanvasFromPath)(sharedPaletteSprite.sharedPalette[i].file), 16);
        if (forcedPalette) {
            c = await (0, canvas_1.forceCanvasToPalette)(c, forcedPalette);
        }
        canvases.push(c);
        subsprites.push(sharedPaletteSprite.sharedPalette[i]);
    }
    const { palette: commonPalette, canvas: forcedPaletteCanvas } = forcedPalette
        ? {
            palette: (0, palette_1.getForcedPalette)(forcedPalette),
            canvas: forcedPalette,
        }
        : (0, palette_1.reduceCanvases)(canvases);
    if (!forcedPalette && !sharedPaletteSprite.trimPalette) {
        while (commonPalette.length < 16) {
            commonPalette.push(0);
        }
    }
    const subspriteResults = [];
    for (const subsprite of subsprites) {
        const subspriteResult = await processBasicSprite(subsprite, forcedPaletteCanvas);
        const { palette, ...subspriteResultWithoutPalette } = subspriteResult;
        subspriteResults.push(subspriteResultWithoutPalette);
    }
    if (typeof sharedPaletteSprite.transparentColor === "number") {
        commonPalette[0] = sharedPaletteSprite.transparentColor;
    }
    return {
        type: "SharedPaletteSprites",
        spec: sharedPaletteSprite,
        palette: commonPalette,
        subsprites: subspriteResults,
    };
}
//# sourceMappingURL=sprite.js.map