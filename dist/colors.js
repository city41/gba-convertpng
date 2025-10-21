"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rgbToGBA16 = rgbToGBA16;
function rgbToGBA16(r, g, b) {
    const gbaR = Math.floor((31 * r) / 255);
    const gbaG = Math.floor((31 * g) / 255);
    const gbaB = Math.floor((31 * b) / 255);
    return (gbaB << 10) | (gbaG << 5) | gbaR;
}
//# sourceMappingURL=colors.js.map