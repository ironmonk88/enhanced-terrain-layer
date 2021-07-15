# Version 1.0.31
Added option to ignore snap to grid when calculating cost

Added option to not show border

Added option to change the picture shown

# Version 1.0.30
Split terrainAt into two functions terrainFromPixel and terrainFromGrid to make it more understandable.

Fixed the text in the terrain config dialog to reflect that it's the active state and not the hidden state that's changing.

Changes to the README frile to correct some errors, Thank you caewok!

Added setting to change dead token to not count as difficult terrain.

# Version 1.0.29
Fixed issue with the config dialog

Added option to set the color for individual terrain

# Version 1.0.28
Support for Foundry 0.8.x

# Version 1.0.27
Fixing issue when attempting to move a terrain, but not really moving it would cause it to disappear.

Added option to not show inactive terrain for the GM unless on the terrain layer.

Changed some of the language to better describe what toggle switches do.

Added option to create default terrain by double clicking

# Version 1.0.26
Fixing issue with determining token as difficult terrain on a gridless maps

Fixing issue with the Terrain Config not updating the terrain to clients

Fixing weird issue where deactivating the terrain was causing the objects array not to be populated.

# Version 1.0.25
Fixing issue with wrapping the AbilityTemplate.fromItem function

Adding icons for Urban and Furniture environments

Adding a Hook for Terrain Environments

Adding support for gridless maps

Better error handling for calculate function, to confirm options passed into the function

Changed terraintype to terrain height to make it a little more transparent as to what's being calculated.  And added extra controls on the terrain HUD to display the height of the terrain.

Updated the cost function to be more effecient

# Version 1.0.24
Fixing an issue with Enhanced Terrain Layer not finding a place to put the additional controls on an item.

Adding Urban environment, and Furniture obstacle.

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
