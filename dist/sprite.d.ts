import { BasicSpriteSpec, Format, SpriteSpec } from "./types";
import { Canvas } from "canvas";
type ProcessSpriteResult = {
    canvas: Canvas;
    tilesSrc: string[] | number[];
    paletteSrc: string | number[];
};
declare function isBasicSpriteSpec(sprite: SpriteSpec): sprite is BasicSpriteSpec;
declare function processSprite(sprite: SpriteSpec, format: Format, forcedPalettePath?: string): Promise<ProcessSpriteResult>;
export { isBasicSpriteSpec, processSprite };
export type { ProcessSpriteResult };
