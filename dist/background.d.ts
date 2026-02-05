import { BackgroundSpec, ProcessBackgroundResult } from "./types";
declare function isProcessBackgroundResult(obj: unknown): obj is ProcessBackgroundResult;
declare function processBackground(bg: BackgroundSpec): Promise<ProcessBackgroundResult>;
export { processBackground, isProcessBackgroundResult };
export type { ProcessBackgroundResult };
