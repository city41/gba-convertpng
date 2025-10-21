import { Canvas } from "canvas";
declare function extractPalette(c: Canvas, pad?: boolean): number[];
declare function reducePalettes(palettes: number[][]): number[];
export { extractPalette, reducePalettes };
