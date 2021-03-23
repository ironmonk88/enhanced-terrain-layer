# Enhanced Terrain Layer
Adds a Terrain Layer to Foundry that can be used by other modules to calculate difficult terrain.

## Installation
Simply use the install module screen within the FoundryVTT setup

## Usage & Current Features
Currently you can draw a polygon onto the map to represent the terrain at that location.  You can then set how difficult that terrain is to move through, and what type of terrain it is, and if it affects ground based tokens or air based tokens.

The Terrain Layer will also let you assign difficulty to measured templates.  You can use this for spells that set difficult terrain.  And it will also calculate other tokens so that when you're moving through another creatures square it will count as difficult terrain.

Terrain Layer will show when a token is selected and dragged across the screen, staying out of sight until needed.  You can also set it so that it's always visible.

You can also set blocks of Terrain to be shown or not shown, so if the difficult terrain is only temporary or conditional you can control it.

## Coding
For those who are developing Rulers based on the Enhanced Terrain Layer, to get access to the difficulty cost of terrain grid you call the cost function.
`canvas.terrrain.cost(pts, options);`
pts can be a single object {x: 0, y:0}, or an array of point objects.
options {elevation: 0, ignore:[]} lets the terrain layer know certain things about what you're asking for.
Passing in 'elevation' for the tokens elevation will ignore any difficult terrain caused by other tokens if the elevation is not the same.  
Passing in an array of environments to ignore will cause the Terrain Layer to ignore any difficult terrain that has that environment label.

A list of Terrain Environments can be found by calling canvas.terrain.environment(); and can be overridden if the environments in your game differ.

if you need to find the terrain at a certain grid co-ordinate you can call `canvas.terrain.terrainAt(x, y);`  This is useful if you want to determine if the terrain in question is water, and use the swim speed instead of walking speed to calculate speed.

## Credit
The orginal idea came from the Terrain Layer module.  But in the process of re-developing it I realised that none of the original code remained.  This is why I branched out into a new module.  But I want to give credit to the original author Will Saunders.

## Bug Reporting
Please feel free to contact me on discord if you have any questions or concerns. ironmonk88#4075

## Support

If you feel like being generous, stop by my <a href="https://www.patreon.com/ironmonk">patreon</a>.  Not necessary but definitely appreciated.

## License
This Foundry VTT module, writen by Ironmonk, is licensed under [GNU GPLv3.0](https://www.gnu.org/licenses/gpl-3.0.en.html), supplemented by [Commons Clause](https://commonsclause.com/).

This work is licensed under Foundry Virtual Tabletop [EULA - Limited License Agreement for module development v 0.1.6](http://foundryvtt.com/pages/license.html).
