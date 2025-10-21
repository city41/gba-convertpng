"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processBackground = processBackground;
const asm_1 = require("./asm");
const canvas_1 = require("./canvas");
const palette_1 = require("./palette");
const tile_1 = require("./tile");
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const c_1 = require("./c");
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
async function processBackground(bg, format) {
    const canvas = await (0, canvas_1.reduceColors)(await (0, canvas_1.createCanvasFromPath)(bg.file), 16);
    const palette = (0, palette_1.extractPalette)(canvas, !bg.trimPalette);
    const allTilesThatFormImage = (0, tile_1.extractTiles)(canvas, palette, 1);
    const dedupedTiles = (0, tile_1.dedupeTiles)(allTilesThatFormImage);
    const map = extractMap(allTilesThatFormImage, dedupedTiles);
    const toSrcFun = format === "C" ? c_1.toC : asm_1.toAsm;
    return {
        tilesAsmSrc: toSrcFun(dedupedTiles.flat(1), "b", 4, format),
        paletteAsmSrc: toSrcFun(palette, "w", 4, format),
        mapAsmSrc: toSrcFun(map, "w", 8, format),
    };
}
//# sourceMappingURL=background.js.map