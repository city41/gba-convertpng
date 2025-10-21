"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toHexByte = toHexByte;
exports.toHexWord = toHexWord;
function toHexByte(num) {
    const rawHex = num.toString(16);
    const neededFiller = Math.max(2 - rawHex.length, 0);
    const filler = new Array(neededFiller).fill("0").join("");
    return `0x${filler}${rawHex}`;
}
function toHexWord(num) {
    const rawHex = num.toString(16);
    const neededFiller = Math.max(4 - rawHex.length, 0);
    const filler = new Array(neededFiller).fill("0").join("");
    return `0x${filler}${rawHex}`;
}
//# sourceMappingURL=toHex.js.map