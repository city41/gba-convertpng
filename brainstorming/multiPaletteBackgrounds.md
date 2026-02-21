convert the entire image into a 15 bit color matrix
-- technically an "image", but since it's just a 2d array of words, it doesn't follow any known format

extract the palette for every tile, and associate it with the tile

group all tiles together by common palette

combine palettes

- look at all the grouped palettes and pack them to be as close to 15 as possible

write the tile data

- for each tile, use its palette to write out the nybbles as before

write out the palettes

- write the palettes out as before, but this time there will be more than one

write the map

- for each tile in the map, write its palette index into the map

in game

- need to write all the palettes into palette ram contiguously, and note the starting palette index
- when writing the map into vram, need to add the starting palette index to all map palette indexes
