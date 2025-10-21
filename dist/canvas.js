"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCanvasFromPath = createCanvasFromPath;
exports.reduceColors = reduceColors;
exports.forceCanvasToPalette = forceCanvasToPalette;
const path = __importStar(require("node:path"));
const os = __importStar(require("node:os"));
const fsp = __importStar(require("node:fs/promises"));
const canvas_1 = require("canvas");
const imagemagick_1 = __importDefault(require("imagemagick"));
const mkdirp_1 = require("mkdirp");
const nearest_color_1 = __importDefault(require("nearest-color"));
async function _reduceColorsWithMagick(renderedFilePath, maxColors) {
    const outputPath = `${renderedFilePath}.reduced.png`;
    return new Promise((resolve, reject) => {
        imagemagick_1.default.convert([
            renderedFilePath,
            "-dither",
            "none",
            "-colors",
            maxColors.toString(),
            `png8:${outputPath}`,
        ], (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(outputPath);
            }
        });
    });
}
async function reduceColors(c, maxColors) {
    const tmpDir = path.resolve(os.tmpdir(), `reduceColors_${Date.now()}`);
    await (0, mkdirp_1.mkdirp)(tmpDir);
    const tmpPath = path.resolve(tmpDir, `_reduceColors_${maxColors}_${Date.now()}.png`);
    const b = c.toBuffer();
    await fsp.writeFile(tmpPath, b);
    const reducedPath = await _reduceColorsWithMagick(tmpPath, maxColors);
    return createCanvasFromPath(reducedPath);
}
async function createCanvasFromPath(pngPath) {
    return new Promise((resolve, reject) => {
        const img = new canvas_1.Image();
        img.onload = () => {
            const canvas = (0, canvas_1.createCanvas)(img.width, img.height);
            const context = canvas.getContext("2d");
            context.drawImage(img, 0, 0);
            resolve(canvas);
        };
        img.onerror = reject;
        img.src = pngPath;
    });
}
function findNearestColor(pixel, palette) {
    const colorsInput = [];
    for (let p = 0; p < palette.length; p += 4) {
        colorsInput.push({
            name: `color${p / 4}`,
            source: "",
            rgb: {
                r: palette[p],
                g: palette[p + 1],
                b: palette[p + 2],
            },
        });
    }
    const pixelInput = {
        r: pixel[0],
        g: pixel[1],
        b: pixel[2],
    };
    const nearestResult = (0, nearest_color_1.default)(pixelInput, colorsInput);
    pixel[0] = nearestResult.rgb.r;
    pixel[1] = nearestResult.rgb.g;
    pixel[2] = nearestResult.rgb.b;
    return pixel;
}
function isMagenta(pixel) {
    return pixel[0] === 255 && pixel[1] === 0 && pixel[2] === 255;
}
async function forceCanvasToPalette(canvas, palette) {
    if (palette.width !== 15) {
        throw new Error("forceCanvasToPalette: palette needs to be 15px wide (it should not have zero/magenta in it)");
    }
    if (palette.height !== 1) {
        throw new Error("forceCanvasToPalette: palette needs to be 1px tall");
    }
    const canvasImageData = canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height);
    const paletteImageData = palette
        .getContext("2d")
        .getImageData(0, 0, palette.width, palette.height);
    for (let p = 0; p < canvasImageData.data.length; p += 4) {
        const pixel = canvasImageData.data.slice(p, p + 4);
        if (isMagenta(pixel)) {
            continue;
        }
        const nearestPixel = findNearestColor(pixel, paletteImageData.data);
        canvasImageData.data.set(nearestPixel, p);
    }
    canvas.getContext("2d").putImageData(canvasImageData, 0, 0);
    return canvas;
}
//# sourceMappingURL=canvas.js.map