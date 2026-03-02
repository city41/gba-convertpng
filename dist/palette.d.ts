import { Canvas } from "canvas";
import { PaletteSpec, ProcessPaletteResult } from "./types";
declare const MAGENTA_15: number;
declare function isProcessPaletteResult(obj: unknown): obj is ProcessPaletteResult;
declare function getForcedPalette(c: Canvas): number[];
declare function extractPalette(c: Canvas, pad?: boolean): number[];
declare function extractPalette15(data15: number[], pad?: boolean): number[];
declare function reduceCanvases(canvases: Canvas[]): {
    palette: number[];
    canvas: Canvas;
};
declare function processPalette(palette: PaletteSpec): Promise<ProcessPaletteResult>;
export { processPalette, isProcessPaletteResult, extractPalette, extractPalette15, getForcedPalette, reduceCanvases, MAGENTA_15 };
