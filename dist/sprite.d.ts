import { BasicSpriteSpec, ProcessBasicSpriteResult, ProcessSharedPaletteSpritesResult, SharedPaletteSpriteSpec, SpriteSpec } from "./types";
import { Canvas } from "canvas";
declare function isSharedPaletteSpriteSpec(obj: unknown): obj is SharedPaletteSpriteSpec;
declare function isBasicSpriteSpec(sprite: SpriteSpec): sprite is BasicSpriteSpec;
declare function processBasicSprite(sprite: BasicSpriteSpec, forcedPaletteOverride?: Canvas): Promise<ProcessBasicSpriteResult>;
declare function processSharedPaletteSprites(sharedPaletteSprite: SharedPaletteSpriteSpec): Promise<ProcessSharedPaletteSpritesResult>;
export { isBasicSpriteSpec, isSharedPaletteSpriteSpec, processBasicSprite, processSharedPaletteSprites, };
export type { ProcessBasicSpriteResult, ProcessSharedPaletteSpritesResult };
