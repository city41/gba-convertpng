"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processBackground = processBackground;
exports.isProcessBackgroundResult = isProcessBackgroundResult;
const canvas_1 = require("./canvas");
const palette_1 = require("./palette");
const tile_1 = require("./tile");
const isEqual_1 = __importDefault(require("lodash/isEqual"));
function isProcessBackgroundResult(obj) {
    return (obj !== null &&
        typeof obj === "object" &&
        "background" in obj &&
        typeof obj.background === "object" &&
        obj.background !== null &&
        "file" in obj.background);
}
function extractMap(allTilesThatFormImage, dedupedTiles) {
    const map = [];
    allTilesThatFormImage.forEach((tile, i) => {
        const index = dedupedTiles.findIndex((dt) => {
            return (0, isEqual_1.default)(dt, tile);
        });
        if (index < 0) {
            throw new Error("extractMap: failed to find a matching tile in the deduped tile set");
        }
        map.push(index);
    });
    return map;
}
async function processBackground(bg) {
    // const canvas = await reduceColors(await createCanvasFromPath(bg.file), 16);
    let canvas = await (0, canvas_1.createCanvasFromPath)(bg.file);
    if (typeof bg.reduceColors === "undefined" || bg.reduceColors === true) {
        canvas = await (0, canvas_1.reduceColors)(canvas, 16);
    }
    canvas = (0, canvas_1.roundUpToTileSize)(canvas);
    const palette = (0, palette_1.extractPalette)(canvas, !bg.trimPalette);
    console.log("palette size", palette.length);
    const allTilesThatFormImage = (0, tile_1.extractTiles)(canvas, palette, 1);
    const dedupedTiles = (0, tile_1.dedupeTiles)(allTilesThatFormImage);
    const map = extractMap(allTilesThatFormImage, dedupedTiles);
    if (typeof bg.transparentColor === "number") {
        palette[0] = bg.transparentColor;
    }
    return {
        canvas,
        background: bg,
        tiles: dedupedTiles.flat(1),
        palette,
        map,
    };
}
//# sourceMappingURL=background.js.map