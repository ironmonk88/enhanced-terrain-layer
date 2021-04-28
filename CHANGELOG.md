# Version 1.0.23
Fixing an issue with changing environment back to blank affecting the icon.

Merging environment and obstacles so that it's just one list.  But added the option to set an item in the environment list as being an obstacle, so they can still be shown in separate lists.  This fixes issues when using the option to use obstacles with environment.  Setting an obstacle without an environment caused issues.

Adding a side menu to change the environment type from the terrain HUD.

Added integration with spells, so you can set the difficulty, environment, and terrain type of the spell and it will translate to the measured template produced.  Only works for DnD5e right now, but if it gets added to more systems then I'll update it.

Fixed the image path names so that it wasn't hard coded to the enhanced terrain layer folder.  And overriding the environment will now let you override the image used.

# Version 1.0.21
Added icons for the different environments

Added the option to set different colours for each environment, aswell as a default color for the scene and a global default colour.

# Version 1.0.20
Added obstacles

Added option to combine obstacles with the environment, or to use them independantly.

# Version 1.0.18
Add setting to not show terrain when dragging a token

The original Terrain Layer does not play nice with the Enhanced Terrain Layer.  Added code to make sure they can exist at the same time.

Fixed issue with opacity

Added different border for hidden terrain instead of setting the opacity

# Version 1.0.17
Added function to try and copy old data from TerrainLayer

Changed the way environment and terraintype are handled to better override

Added verbose option

Added reduce functionality

Added refresh when show text is changed

# Version 1.0.16
Fixed an issue with ignoring environment

# Version 1.0.15
Fixed and issue with elevation

Fixed an issue with terrainAt

# Version 1.0.14
update the code so that tokens don't think of themselves as difficult terrain.  This will require the ruler to pass in the token that is moving.

Updated the english settings.  Missed some text.

Fixed an issue where environment type wasn't showing.

# Version 1.0.12
costGrid wasn't updating when you cahnged scenes.  It now does.

# Version 1.0.11
Initial Release.