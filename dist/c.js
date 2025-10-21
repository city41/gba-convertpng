"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toC = toC;
const toHex_1 = require("./toHex");
function toC(data, width, numbersPerRow) {
    const hexFn = width === "b" ? toHex_1.toHexByte : toHex_1.toHexWord;
    const rows = [];
    let row = [];
    for (let i = 0; i < data.length; ++i) {
        if (row.length === numbersPerRow) {
            rows.push(row.join(",") + ",");
            row = [];
        }
        row.push(hexFn(data[i]));
    }
    rows.push(row.join(","));
    return `{ ${rows.join("\r\n")} }`;
}
//# sourceMappingURL=c.js.map