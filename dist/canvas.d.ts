import { Canvas } from "canvas";
declare function reduceColors(c: Canvas, maxColors: number): Promise<Canvas>;
declare function createCanvasFromPath(pngPath: string): Promise<Canvas>;
declare function forceCanvasToPalette(canvas: Canvas, palette: Canvas): Promise<Canvas>;
export { createCanvasFromPath, reduceColors, forceCanvasToPalette };
