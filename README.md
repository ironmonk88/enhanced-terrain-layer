# Difficult Terrain
Adds a Terrain Layer to Foundry for use as a dependency for other modules that may want to incorporate Difficult Terrain into their modules. Does not currently work with GRIDLESS maps. As this is an Alpha, very open to feedback for features other module developers or users might like incorporated. Currently using the DnD5e Difficult Terrain 'Triangle' as an indicator.

Activate Terrain layer by selecting it from controls menu. 
VISIBILITY TOGGLE - Set the visibility of the layer. Does not clear data.
ADD MODE - Left click to add, right click to delete. Left click and drag to select multiple squares to add. Hold CTRL down while dragging to REMOVE squares. Select on a previously laid tile to cycle through the terrain modifier multiple. Currently only 2 and 3.
REMOVE MODE - Left click to remove, click and drag to remove multiple.
RESET TERRAIN - Clears terrain layer.

This is still in very early stages still. Some ideas for the future of the mod include:
* customizable tile icon:shape,color,opacity, and possibly using an image instead.
* Impassable tiles and/or "dangerous" tiles. 

# Changelog
0.0.7 - 7.6 update. Added some configurable options for Icon Scale, Opacity, and Multiples.
0.0.6 - Fixed problem with hex grid and add warning message to unsupported gridless maps.
0.0.5 - A whole lotta bugfixes.
0.0.4 - Changes to Terrain layer now broadcast to players.
0.0.3 - Fixed bug where multiple was being overwritten on scene load back to default 2
0.0.2 - Realized Terrain Squares were getting painted over fog and sight layers. Fixed that right up.
0.0.1 - Initial alpha release. Adds Terrain Layer to Foundry. GM can paint Difficult Terrain Squares on to map. Purely Aesthetic at this point, but my hope is that other module developers can use this as a dependency if needed to check the grid for places with difficult terrain. Plan on doing deep integration with ShowDragDistance and my future enhanced movement module.
