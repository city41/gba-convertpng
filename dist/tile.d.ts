import { Canvas } from "canvas";
declare function extractTiles(c: Canvas, palette: number[], frameCount: number): number[][];
declare function dedupeTiles(tiles: number[][]): number[][];
export { extractTiles, dedupeTiles };
