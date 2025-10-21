import { toHexByte, toHexWord } from "./toHex";
import { Format } from "./types";

function toC(
  data: number[],
  width: "b" | "w",
  numbersPerRow: number,
  format: Format
): string {
  if (format !== "C") {
    throw new Error(`toC: given an incompatible format (${format})`);
  }

  const hexFn = width === "b" ? toHexByte : toHexWord;

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

  return `{ ${rows.join("\r\n")} }`;
}

export { toC };
