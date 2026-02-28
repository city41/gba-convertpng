import { Canvas } from "canvas";
declare const MAGENTA_15: number;
declare function getForcedPalette(c: Canvas): number[];
declare function extractPalette(c: Canvas, pad?: boolean): number[];
declare function extractPalette15(data15: number[], pad?: boolean): number[];
declare function reduceCanvases(canvases: Canvas[]): {
    palette: number[];
    canvas: Canvas;
};
export { extractPalette, extractPalette15, getForcedPalette, reduceCanvases, MAGENTA_15 };
