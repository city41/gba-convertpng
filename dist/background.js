"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processBackground = processBackground;
exports.isProcessBackgroundResult = isProcessBackgroundResult;
const canvas_1 = require("./canvas");
const colors_1 = require("./colors");
const lodash_1 = require("lodash");
const palette_1 = require("./palette");
function isProcessBackgroundResult(obj) {
    return (obj !== null &&
        typeof obj === "object" &&
        "background" in obj &&
        typeof obj.background === "object" &&
        obj.background !== null &&
        "file" in obj.background);
}
function convertTileTo15Bit(rawTile) {
    const data15 = [];
    for (let p = 0; p < rawTile.length; p += 4) {
        if (rawTile[p + 3] !== 255) {
            data15.push(palette_1.MAGENTA_15);
        }
        else {
            data15.push((0, colors_1.rgbToGBA15)(rawTile[p], rawTile[p + 1], rawTile[p + 2]));
        }
    }
    return data15;
}
function getTileIndex(tilePalette, tile) {
    const index = tilePalette.findIndex(t => {
        return t.join('-') === tile.join('-');
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
function combinePalettes(palettes) {
    if (palettes.length <= 1) {
        return palettes;
    }
    const sortedPalettes = (0, lodash_1.sortBy)(palettes, p => p.length);
    let firstPalette = sortedPalettes[0];
    const remainingPalettes = [];
    for (let p = 1; p < sortedPalettes.length; ++p) {
        const otherPalette = sortedPalettes[p];
        const otherPaletteUniqueColors = otherPalette.filter(c => !firstPalette.includes(c));
        if (firstPalette.length + otherPaletteUniqueColors.length < 16) {
            firstPalette = firstPalette.concat(otherPaletteUniqueColors);
        }
        else {
            remainingPalettes.push(otherPalette);
        }
    }
    const combinedOtherPalettes = combinePalettes(remainingPalettes);
    return [firstPalette].concat(combinedOtherPalettes);
}
function buildMap(tiles, bgWidthPx, bgHeightPx) {
    const map = [];
    const bgWidthT = bgWidthPx / 8;
    const bgHeightT = bgHeightPx / 8;
    for (let y = 0; y < bgHeightT; ++y) {
        for (let x = 0; x < bgWidthT; ++x) {
            const tile = tiles[y * bgWidthT + x];
            map.push(tile.paletteIndex << 12 | tile.tileIndex);
        }
    }
    return map;
}
function getGBATile(data15, palette) {
    const gbaTile = [];
    for (let p = 0; p < data15.length; p += 2) {
        const highNibble = palette.indexOf(data15[p + 1]);
        const lowNibble = palette.indexOf(data15[p]);
        const byte = (highNibble & 0xf) << 4 | (lowNibble & 0xf);
        gbaTile.push(byte);
    }
    return gbaTile;
}
function findMatchingPalette(data15, palettes) {
    const foundPalette = palettes.find(palette => {
        return data15.every(c => palette.includes(c));
    });
    if (!foundPalette) {
        throw new Error('findMatchingPalette: failed to find a palette');
    }
    return foundPalette;
}
function padPalette(palette) {
    while (palette.length < 16) {
        palette.push(0);
    }
    return palette;
}
async function processBackground(bg) {
    let canvas = await (0, canvas_1.createCanvasFromPath)(bg.file);
    if (typeof bg.reduceColors === "undefined" || bg.reduceColors === true) {
        canvas = await (0, canvas_1.reduceColors)(canvas, 16);
    }
    canvas = (0, canvas_1.roundUpToTileSize)(canvas);
    const ctx = canvas.getContext('2d');
    const tiles = [];
    const tilePalette = [];
    let palettes = [];
    // first, determine the palettes
    for (let y = 0; y < canvas.height; y += 8) {
        for (let x = 0; x < canvas.width; x += 8) {
            const rawTile = Array.from(ctx.getImageData(x, y, 8, 8).data);
            const data15 = convertTileTo15Bit(rawTile);
            const palette = (0, palette_1.extractPalette15)(data15, false);
            palettes = combinePalettes(palettes.concat([palette]));
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
    return {
        background: bg,
        canvas,
        map,
        palette: paletteData,
        paletteCount,
        tiles: tileData
    };
}
//# sourceMappingURL=background.js.map