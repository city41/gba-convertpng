"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPalette = extractPalette;
exports.reducePalettes = reducePalettes;
const colors_1 = require("./colors");
const MAGENTA = (0, colors_1.rgbToGBA16)(255, 0, 255);
function extractPalette(c, pad = true) {
    const gbaColors = new Set();
    const imageData = c.getContext("2d").getImageData(0, 0, c.width, c.height);
    for (let p = 0; p < imageData.data.length; p += 4) {
        // skip anything not fully opaque
        if (imageData.data[p + 3] !== 255) {
            continue;
        }
        const r = imageData.data[p];
        const g = imageData.data[p + 1];
        const b = imageData.data[p + 2];
        const gbaColor = (0, colors_1.rgbToGBA16)(r, g, b);
        gbaColors.add(gbaColor);
    }
    const rawPalette = Array.from(gbaColors);
    // make sure there is no magenta in the palette
    const paletteWithoutMangenta = rawPalette.filter((c) => c !== MAGENTA);
    // then append magenta as the first color, to become transparent
    const palette = [MAGENTA].concat(paletteWithoutMangenta);
    while (pad && palette.length < 16) {
        palette.push(0);
    }
    return palette;
}
function reducePalettes(palettes) {
    const colorMap = {};
    const mergedPalette = [];
    for (const palette of palettes) {
        for (const color of palette) {
            if (!colorMap[color]) {
                colorMap[color] = true;
                mergedPalette.push(color);
            }
        }
    }
    if (mergedPalette.length > 16) {
        throw new Error(`reducePalette: final palette is too large: ${mergedPalette.length}`);
    }
    return mergedPalette;
}
//# sourceMappingURL=palette.js.map