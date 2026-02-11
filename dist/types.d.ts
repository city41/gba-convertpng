import { Canvas } from "canvas";
export type Format = "C" | "C.inc" | "z80" | "pyz80" | "asz80" | "bin";
export type Width = "b" | "w" | "dw";
export type BasicSpriteSpec = {
    file: string;
    frames: number;
    trimPalette?: boolean;
    forcePalette?: string;
    transparentColor?: number;
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
};
export type JsonSpec = Required<ImportedJsonSpec>;
export type ProcessBasicSpriteResult = {
    sprite: BasicSpriteSpec;
    canvas: Canvas;
    tiles: number[];
    palette?: number[];
};
export type ProcessSharedPaletteSpritesResult = {
    sprite: SharedPaletteSpriteSpec;
    subsprites: ProcessBasicSpriteResult[];
    palette: number[];
};
export type ProcessBackgroundResult = {
    background: BackgroundSpec;
    tiles: number[];
    palette: number[];
    map: number[];
};
export type ProcessBitmapResult = {
    bitmap: BitmapSpec;
    width: number;
    height: number;
    pixels: number[];
};
