import { DataWidth } from "./types";
declare function toCinc(data: number[], width: DataWidth, numbersPerRow: number, bracketsOnOwnLine?: boolean): string;
declare function toCc(data: number[], width: "b" | "w" | "dw", numbersPerRow: number, variableName: string, fileNameRoot: string): string;
declare function toCh(data: number[], dataWidth: DataWidth, variableName: string, extraContent?: string): string;
export { toCinc, toCc, toCh };
