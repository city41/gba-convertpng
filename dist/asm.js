"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAsm = toAsm;
const toHex_1 = require("./toHex");
function toAsm(data, width, numbersPerRow, format) {
    if (format !== "asz80" && format !== "z80" && format !== "pyz80") {
        throw new Error(`toAsm: given an incompatible format (${format})`);
    }
    const hexFn = width === "b" ? toHex_1.toHexByte : toHex_1.toHexWord;
    const dPrefix = format === "pyz80" ? "" : ".";
    const rows = [];
    let row = [];
    for (let i = 0; i < data.length; ++i) {
        if (row.length === numbersPerRow) {
            rows.push(` ${dPrefix}d${width} ${row.join(",")}`);
            row = [];
        }
        row.push(hexFn(data[i]));
    }
    rows.push(` ${dPrefix}d${width} ${row.join(",")}`);
    return rows.join("\r\n") + "\r\n";
}
//# sourceMappingURL=asm.js.map