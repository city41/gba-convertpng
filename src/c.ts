import { toHexByte, toHexDoubleWord, toHexWord } from "./toHex";
import { DataWidth } from "./types";

const widthToDataType: Record<DataWidth, string> = {
  b: "u8",
  w: "u16",
  dw: "u32",
};
const widthToSize: Record<DataWidth, number> = {
  b: 1,
  w: 2,
  dw: 4,
};

const widthToHexFunction: Record<DataWidth, (a: number) => string> = {
  b: toHexByte,
  w: toHexWord,
  dw: toHexDoubleWord,
};

function toCinc(
  data: number[],
  width: DataWidth,
  numbersPerRow: number,
  bracketsOnOwnLine = false,
): string {
  const hexFn = widthToHexFunction[width];

  const rows: string[] = [];

  let row: string[] = [];

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
  } else {
    return `{ ${rows.join("\r\n")} }`;
  }
}

function toCc(
  data: number[],
  width: "b" | "w" | "dw",
  numbersPerRow: number,
  variableName: string,
  fileNameRoot: string,
): string {
  const dataType = widthToDataType[width];

  const entries = toCinc(data, width, numbersPerRow, true);

  const src = `#include "${fileNameRoot}.h"

const ${dataType} ${variableName}[${variableName.toUpperCase()}_COUNT] = ${entries}; `;

  return src;
}

function toCh(
  data: number[],
  dataWidth: DataWidth,
  variableName: string,
  extraContent?: string,
): string {
  const dataType = widthToDataType[dataWidth];
  const dataSize = widthToSize[dataWidth];
  const count = data.length;

  const src = `#pragma once
#include <tonc.h>

#define ${variableName.toUpperCase()}_BYTE_LENGTH ${count * dataSize}
#define ${variableName.toUpperCase()}_COUNT ${count}

${extraContent ?? ""}

extern const ${dataType} ${variableName}[${variableName.toUpperCase()}_COUNT];`;

  return src;
}

export { toCinc, toCc, toCh };
