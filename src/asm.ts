import { toHexByte, toHexWord } from "./toHex";
import { Format } from "./types";

function toAsm(
  data: number[],
  width: "b" | "w",
  numbersPerRow: number,
  format: Format
): string {
  if (format !== "asz80" && format !== "z80" && format !== "pyz80") {
    throw new Error(`toAsm: given an incompatible format (${format})`);
  }

  const hexFn = width === "b" ? toHexByte : toHexWord;
  const dPrefix = format === "pyz80" ? "" : ".";
  const rows: string[] = [];

  let row: string[] = [];

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

export { toAsm };
