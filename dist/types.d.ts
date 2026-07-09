import { Canvas } from "canvas";
export type Format = "C" | "C.inc" | "z80" | "pyz80" | "asz80" | "bin";
export type DataWidth = "b" | "w" | "dw";
export type BasicSpriteSpec = {
    file: string;
    frames: number;
    trimPalette?: boolean;
    forcePalette?: string;
    transparentColor?: number;
};
export type PaletteSpec = {
    file: string;
    trimPalette?: boolean;
    forcePalette?: boolean;
};
export type SharedPaletteSpriteSpec = {
    name: string;
    trimPalette?: boolean;
    sharedPalette: BasicSpriteSpec[];
    forcePalette?: string;
    transparentColor?: number;
};
export type SpriteSpec = BasicSpriteSpec | SharedPaletteSpriteSpec;
export type BackgroundSpec = {
    file: string;
    trimPalette?: boolean;
    transparentColor?: number;
    reduceColors?: boolean;
    forcePalette?: string;
};
export type BitmapSpec = {
    file: string;
};
export type ImportedJsonSpec = {
    outputDir: string;
    format?: Format;
    sprites?: SpriteSpec[];
    backgrounds?: BackgroundSpec[];
    bitmaps?: BitmapSpec[];
    palettes?: PaletteSpec[];
    exportResultsPath?: string;
};
export type SrcFile = {
    src: string;
    extension: string;
};
export type SrcFiles = {
    tile: SrcFile[];
    palette: SrcFile[];
    map: SrcFile[];
    bitmap: SrcFile[];
};
export type WriteFiles = (srcFiles: SrcFiles, spec: BasicSpriteSpec | BackgroundSpec | SharedPaletteSpriteSpec | BitmapSpec | PaletteSpec, outputDir: string) => Promise<void>;
export type ToSrcFiles = (result: ProcessBasicSpriteResult | ProcessBackgroundResult | ProcessSharedPaletteSpritesResult | ProcessBitmapResult | ProcessPaletteResult, format: Format) => SrcFiles;
export type ExportResults = (results: ProcessResult[], spec: JsonSpec, writeFiles: WriteFiles, toSrcFiles: ToSrcFiles) => Promise<void>;
export type JsonSpec = Required<Omit<ImportedJsonSpec, "exportResultsPath">> & {
    exportResults: ExportResults;
};
export type ProcessBasicSpriteResult = {
    type: "BasicSprite";
    spec: BasicSpriteSpec;
    canvas: Canvas;
    tiles: number[];
    palette?: number[];
};
export type ProcessSharedPaletteSpritesResult = {
    type: "SharedPaletteSprites";
    spec: SharedPaletteSpriteSpec;
    subsprites: ProcessBasicSpriteResult[];
    palette: number[];
};
export type ProcessBackgroundResult = {
    type: "Background";
    canvas: Canvas;
    spec: BackgroundSpec;
    tiles: number[];
    palette: number[];
    paletteCount: number;
    map: number[];
};
export type ProcessBitmapResult = {
    type: "Bitmap";
    spec: BitmapSpec;
    width: number;
    height: number;
    pixels: number[];
};
export type ProcessPaletteResult = {
    type: "Palette";
    spec: PaletteSpec;
    data: number[];
};
export type ProcessResult = ProcessBasicSpriteResult | ProcessSharedPaletteSpritesResult | ProcessBackgroundResult | ProcessBitmapResult | ProcessPaletteResult;
