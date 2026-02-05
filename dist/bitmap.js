"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processBitmap = processBitmap;
exports.isProcessBitmapResult = isProcessBitmapResult;
const canvas_1 = require("./canvas");
const colors_1 = require("./colors");
function isProcessBitmapResult(obj) {
    return (obj !== null &&
        typeof obj === "object" &&
        "bitmap" in obj &&
        typeof obj.bitmap === "object" &&
        obj.bitmap !== null &&
        "file" in obj.bitmap);
}
async function processBitmap(bmp) {
    const canvas = await (0, canvas_1.createCanvasFromPath)(bmp.file);
    const context = canvas.getContext("2d");
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const pixels = [];
    for (let p = 0; p < imageData.length; p += 4) {
        const gbaColor = (0, colors_1.rgbToGBA15)(imageData[p], imageData[p + 1], imageData[p + 2]);
        pixels.push(gbaColor);
    }
    return {
        bitmap: bmp,
        pixels,
    };
}
//# sourceMappingURL=bitmap.js.map