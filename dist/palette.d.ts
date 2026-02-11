import { Canvas } from "canvas";
declare function getForcedPalette(c: Canvas): number[];
declare function extractPalette(c: Canvas, pad?: boolean): number[];
declare function reduceCanvases(canvases: Canvas[]): {
    palette: number[];
    canvas: Canvas;
};
export { extractPalette, getForcedPalette, reduceCanvases };
