#Version 1.0.18
Add setting to not show terrain when dragging a token

The original Terrain Layer does not play nice with the Enhanced Terrain Layer.  Added code to make sure they can exist at the same time.

#Version 1.0.17
Added function to try and copy old data from TerrainLayer

Changed the way environment and terraintype are handled to better override

Added verbose option

Added reduce functionality

Added refresh when show text is changed

#Version 1.0.16
Fixed an issue with ignoring environment

#Version 1.0.15
Fixed and issue with elevation

Fixed an issue with terrainAt

#Version 1.0.14
update the code so that tokens don't think of themselves as difficult terrain.  This will require the ruler to pass in the token that is moving.

Updated the english settings.  Missed some text.

Fixed an issue where environment type wasn't showing.

#Version 1.0.12
costGrid wasn't updating when you cahnged scenes.  It now does.

#Version 1.0.11
Initial Release.