import { BackgroundSpec, Format } from "./types";
type ProcessBackgroundResult = {
    tilesAsmSrc: string;
    paletteAsmSrc: string;
    mapAsmSrc: string;
};
declare function processBackground(bg: BackgroundSpec, format: Format): Promise<ProcessBackgroundResult>;
export { processBackground };
