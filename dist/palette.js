"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPalette = extractPalette;
exports.getForcedPalette = getForcedPalette;
exports.reduceCanvases = reduceCanvases;
const canvas_1 = require("canvas");
const colors_1 = require("./colors");
const MAGENTA_24 = [255, 0, 255, 255];
const MAGENTA = (0, colors_1.rgbToGBA15)(255, 0, 255);
function is24BitMagenta(color) {
    return (color.length === MAGENTA_24.length &&
        color.every((channel, i) => channel === MAGENTA_24[i]));
}
function getForcedPalette(c) {
    const imageData = c.getContext("2d").getImageData(0, 0, c.width, c.height);
    const rawPalette = [];
    for (let p = 0; p < imageData.data.length; p += 4) {
        const r = imageData.data[p];
        const g = imageData.data[p + 1];
        const b = imageData.data[p + 2];
        const gbaColor = (0, colors_1.rgbToGBA15)(r, g, b);
        rawPalette.push(gbaColor);
    }
    const paletteWithoutMangenta = rawPalette.filter((c) => c !== MAGENTA);
    // then append magenta as the first color, to become transparent
    const palette = [MAGENTA].concat(paletteWithoutMangenta);
    return palette;
}
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
        const gbaColor = (0, colors_1.rgbToGBA15)(r, g, b);
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
function reduceCanvases(canvases) {
    const fullRgbColorMap = {};
    for (const c of canvases) {
        const imageData = c.getContext("2d").getImageData(0, 0, c.width, c.height);
        for (let p = 0; p < imageData.data.length; p += 4) {
            const colorS = `${imageData.data[p]}-${imageData.data[p + 1]}-${imageData.data[p + 2]}-${imageData.data[p + 3]}`;
            fullRgbColorMap[colorS] = Array.from(imageData.data.slice(p, p + 4));
        }
    }
    const paletteColors = Object.values(fullRgbColorMap);
    const paletteSize = paletteColors.length;
    if (paletteSize > 16) {
        throw new Error(`reduceCanvasees: final palette is too large: ${paletteSize}`);
    }
    // strip out transparency/magenta
    const opaquePaletteColors = paletteColors.filter((pc) => {
        return pc[3] === 255 && !is24BitMagenta(pc);
    });
    // pad palette out to 15 colors
    while (opaquePaletteColors.length < 15) {
        opaquePaletteColors.push([0, 0, 0, 255]);
    }
    const paletteCanvas = (0, canvas_1.createCanvas)(opaquePaletteColors.length, 1);
    const context = paletteCanvas.getContext("2d");
    const imageData = context.getImageData(0, 0, paletteCanvas.width, paletteCanvas.height);
    opaquePaletteColors.forEach((pcolor, i) => {
        imageData.data[i * 4 + 0] = pcolor[0];
        imageData.data[i * 4 + 1] = pcolor[1];
        imageData.data[i * 4 + 2] = pcolor[2];
        imageData.data[i * 4 + 3] = pcolor[3];
    });
    context.putImageData(imageData, 0, 0);
    return {
        palette: getForcedPalette(paletteCanvas),
        canvas: paletteCanvas,
    };
}
//# sourceMappingURL=palette.js.map