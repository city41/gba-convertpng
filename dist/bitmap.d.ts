import { BitmapSpec, ProcessBitmapResult } from "./types";
declare function isProcessBitmapResult(obj: unknown): obj is ProcessBitmapResult;
declare function processBitmap(bmp: BitmapSpec): Promise<ProcessBitmapResult>;
export { processBitmap, isProcessBitmapResult };
