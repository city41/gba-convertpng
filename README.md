# GBA Convert png

This is a nodejs based tool for converting png images to the tile data format used in GBA games.

**HEADS UP #1:** I make games for the e-Reader, and so far have not done mainstream GBA development. So possibly this tool is missing things for GBA dev. If so, please let me know.

**HEADS UP #2:** This is a very simple tool that can only do a few simple things. If you want a lot of control over your graphics, you probably want to use [Grit](https://www.coranac.com/man/grit/html/grit.htm). Maybe someday convertpng will expand enough to be a good alternative to Grit.

## Installation

Make sure you have a recent version of [nodejs](https://nodejs.org/en) installed.

```bash
npm install -g @city41/gba-convertpng
or
yarn global add @city41/gba-convertpng
```

## Usage

`convertpng` runs off a json spec file.

```bash
gba-convertpng myGBAResources.json
```

This json file provides everything that is needed to convert pngs to GBA data. Here is an example

```json
{
  "outputDir": "./output",
  "sprites": [
    {
      "file": "cursor.png",
      "frames": 2
    }
  ],
  "backgrounds": [
    {
      "file": "myBg.png"
    }
  ]
}
```

This is about as simple as the spec file gets. It will load up `cursor.png` and `myBg.png` and convert them into tile data for the asz80 assembler in files `cursor.tiles.asm`, `cursor.palette.asm`, `myBg.tiles.asm`, `myBg.palette.asm` and `myBg.map.asm`.

And for example, `cursor.palette.asm` looks like this

```asm
.dw 0x7c1f,0x28c4,0x7fff,0x76d2,0,0,0,0,0,0,0,0,0,0,0,0
```

Ideal for dropping into a game that uses the asz80 assembler.

## File paths

All of the image paths specified in the json spec are relative to the spec file. So in the above example, the pngs would be in the same directory as the spec file.

The same is true for `outputDir`, this is a directory path relative to the json spec file. This directory must exist.

## Other source code formats

At the root of the json spec you can add `format` to specify C or pyz80 output.

### C output

```json
{
  "outputDir": "./output",
  "format": "C",
  "sprites": [
    ...
```

C output is a standard C array, either bytes (tile data) or words (palettes). For example with the above json spec, the C output for the cursor palette would be `cursor.palette.c.inc`, and the contents would be

```C
{ 0x7c1f,0x28c4,0x7fff,0x76d2,0,0,0,0,0,0,0,0,0,0,0,0 }
```

The idea is to include it into your C source using the preprocessor, something like:

```C
const u8 cursorTiles[] =
#include "cursor.tiles.c.inc"
;
const u16 cursorPalette[] =
#include "cursor.palette.c.inc"
;
```

(I do almost no C development, so the C output might not be ideal. Let me know if you have any ideas here.)

### pyz80 output

```json
{
  "outputDir": "./output",
  "format": "pyz80",
  "sprites": [
    ...
```

If you specify "pyz80" as the `format`, the output will look like this, for example `cursor.palette.asm`

```asm
dw 0x7c1f,0x28c4,0x7fff,0x76d2,0,0,0,0,0,0,0,0,0,0,0,0
```

The only difference from asz80 is the lack of the leading period.

## Other options

## Sprite frames

All sprite entries must specify how many frames of animation are contained within the png. Each frame should be horizontally laid out within the image.

For example this png is a sprite that has four frames of animation

![sprite with four frames](https://github.com/city41/gba-convertpng/blob/main/multipleFramesExample.png?raw=true)

Even if a sprite just has a single frame of animation, then `"frames": 1` still needs to be specified.

### shared palette

A group of sprites can share a palette like this

```json
{
  "outputDir": "./output",
  "sprites": [
    {
      "sharedPalette": [
        {
          "file": "cursor.png",
          "frames": 2
        },
        {
          "file": "enemy.png",
          "frames": 1
        }
      ],
      "name": "global"
    }
  ]
}
```

In this case convert-png will combine the colors of both sprites into a single 15 color palette, and output it as `global.shared.palette.[asm|c.inc]`, the tile output files for the sprites will be the same as before.

## Trim palette

You can add `"trimPalette": true` to any sprite or background. With this specified, the palette output data will only be as big as needed. For example the palette above with all the trailing zeros becomes this

```asm
.dw 0x7c1f,0x28c4,0x7fff,0x76d2
```

## Force palette

Normally convertpng will examine the pngs and figure out an optimal palette. If you need your data to conform to an existing palette, specify it with `"forcePalette": "<palette-file>"`

This should be a png image that is 15x1, each pixel being a color in the palette.

With forced palettes, imagemagick will be used to push the png files to match this palette. If you create the pngs using that palette, this won't cause any changes. But if you don't, you might be surprised how much your sprite has changed.

With a forced palette, the color indexes within the forced palette will be honored. So if within your palette you have a red at index 1, then the tile data for the sprites/backgrounds will be 1 whenever that red pixel is needed.

## Publishing

gba-convertpng uses [semantic versioning](https://semver.org/)

Publishing a new version is done by bumping the version in package.json

```bash
yarn version
yarn version v1.22.19
info Current version: 0.0.2
question New version: 0.0.3
info New version: 0.0.3
Done in 16.19s.

git push
git push --tags
```

Once [the Publish action](https://github.com/city41/ereader-tools/actions/workflows/publish.yml) notices the version has changed, it will run a build and publish to npm.
