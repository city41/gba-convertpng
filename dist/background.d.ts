import { BackgroundSpec, ProcessBackgroundResult } from "./types";
declare function processBackground(bg: BackgroundSpec): Promise<ProcessBackgroundResult>;
export { processBackground };
