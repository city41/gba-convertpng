import { BackgroundSpec } from "./types";
type ProcessBackgroundResult = {
    background: BackgroundSpec;
    tiles: number[];
    palette: number[];
    map: number[];
};
declare function isProcessBackgroundResult(obj: unknown): obj is ProcessBackgroundResult;
declare function processBackground(bg: BackgroundSpec): Promise<ProcessBackgroundResult>;
export { processBackground, isProcessBackgroundResult };
export type { ProcessBackgroundResult };
