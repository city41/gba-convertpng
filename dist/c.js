"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCinc = toCinc;
exports.toCc = toCc;
exports.toCh = toCh;
const toHex_1 = require("./toHex");
const widthToDataType = {
    b: "u8",
    w: "u16",
    dw: "u32",
};
const widthToSize = {
    b: 1,
    w: 2,
    dw: 4,
};
const widthToHexFunction = {
    b: toHex_1.toHexByte,
    w: toHex_1.toHexWord,
    dw: toHex_1.toHexDoubleWord,
};
function toCinc(data, width, numbersPerRow, bracketsOnOwnLine = false) {
    const hexFn = widthToHexFunction[width];
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
    if (bracketsOnOwnLine) {
        return `{
${rows.join("\r\n")}
}`;
    }
    else {
        return `{ ${rows.join("\r\n")} }`;
    }
}
function toCc(data, width, numbersPerRow, variableName, fileNameRoot) {
    const dataType = widthToDataType[width];
    const entries = toCinc(data, width, numbersPerRow, true);
    const src = `#include "${fileNameRoot}.h"

const ${dataType} ${variableName}[${variableName.toUpperCase()}_COUNT] = ${entries}; `;
    return src;
}
function toCh(data, width, variableName) {
    const dataType = widthToDataType[width];
    const dataSize = widthToSize[width];
    const count = data.length;
    const src = `#pragma once
#include <tonc.h>

#define ${variableName.toUpperCase()}_BYTE_LENGTH ${count * dataSize}
#define ${variableName.toUpperCase()}_COUNT ${count}

extern const ${dataType} ${variableName}[${variableName.toUpperCase()}_COUNT];`;
    return src;
}
//# sourceMappingURL=c.js.map