import { BackgroundSpec } from "./types";
type ProcessBackgroundResult = {
    tilesAsmSrc: string;
    paletteAsmSrc: string;
    mapAsmSrc: string;
};
declare function processBackground(bg: BackgroundSpec): Promise<ProcessBackgroundResult>;
export { processBackground };
