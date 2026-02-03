import { BasicSpriteSpec, SharedPaletteSpriteSpec, SpriteSpec } from "./types";
import { Canvas } from "canvas";
type ProcessBasicSpriteResult = {
    sprite: BasicSpriteSpec;
    canvas: Canvas;
    tiles: number[];
    palette?: number[];
};
type ProcessSharedPaletteSpritesResult = {
    sprite: SharedPaletteSpriteSpec;
    subsprites: ProcessBasicSpriteResult[];
    palette: number[];
};
declare function isSharedPaletteSpriteSpec(obj: unknown): obj is SharedPaletteSpriteSpec;
declare function isProcessBasicSpriteResult(obj: unknown): obj is ProcessBasicSpriteResult;
declare function isProcessSharedPaletteSpritesResult(obj: unknown): obj is ProcessSharedPaletteSpritesResult;
declare function isBasicSpriteSpec(sprite: SpriteSpec): sprite is BasicSpriteSpec;
declare function processBasicSprite(sprite: BasicSpriteSpec, forcedPaletteOverride?: Canvas): Promise<ProcessBasicSpriteResult>;
declare function processSharedPaletteSprites(sharedPaletteSprite: SharedPaletteSpriteSpec): Promise<ProcessSharedPaletteSpritesResult>;
export { isBasicSpriteSpec, processBasicSprite, processSharedPaletteSprites, isSharedPaletteSpriteSpec, isProcessBasicSpriteResult, isProcessSharedPaletteSpritesResult, };
export type { ProcessBasicSpriteResult, ProcessSharedPaletteSpritesResult };
