"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAsm = toAsm;
const toHex_1 = require("./toHex");
function toAsm(data, width, numbersPerRow) {
    const hexFn = width === "b" ? toHex_1.toHexByte : toHex_1.toHexWord;
    const rows = [];
    let row = [];
    for (let i = 0; i < data.length; ++i) {
        if (row.length === numbersPerRow) {
            rows.push(` .d${width} ${row.join(",")}`);
            row = [];
        }
        row.push(hexFn(data[i]));
    }
    rows.push(` .d${width} ${row.join(",")}`);
    return rows.join("\r\n") + "\r\n";
}
//# sourceMappingURL=asm.js.map