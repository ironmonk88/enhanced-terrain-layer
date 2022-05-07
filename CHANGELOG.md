# Version 1.0.41

Fixed issue where editing the colours in the settings was erasing all the colour information.

Added the option to set a terrain's individual opacity.

Added the option to get a list of all available terrains.  Thank you Stäbchenfisch the code looks amazing.  Technically nothing should change for the interface, but this improvement can help Rulers be more effecient.

Fixed an issue with how Enhanced Terrain Layer was determining if a token was dead.

Added the option for Rulers to pass in a function to determine if a Token is considered dead or not.  This will allow system specific ruler to change how tokens are considered "dead".

Fixed some styling with the terrain control buttons when the Scene has set the default terrain cost.  Made it more apparent what's happening, and that the buttons are no longer clickable.

Added key binding to toggle terrain showing.  Used Alt-T to switch between states.

Changed the interface for spells/items so that terrain controls will only appear if the spell requires a measured template.  As terrain details aren't needed otherwise.

Changed the measured template config screen to have tabs, with the terrain onformation on a separate tab.  This should make the dialog a little less cluttered and add more visibility into the terrain controls.

# Version 1.0.40

Improved efficiency by calling the flag data directly instead of through the getFlag function, thank you Stabchenfisch

Added the option to set the background to transparent, in case you want difficult terrain to cover the entire map.

Fixed issues with the placement of the terrain controls

Fixed issue with clearing all the terrain objects from a Scene.

Improved the effeciency of the function that calculates the cost of movement.

# Version 1.0.39

Fixing an issue rendering canvas.terrain.toolbar when it might not be there.

# Version 1.0.38

Fixed issue with the default values for scenes.

Updated the terrain controls so that if a scene had a default it would show that it was being overridden and what the value was.

Added API to get the elevation from a set of points.

# Version 1.0.37

Changed from using min/max to elevation and depth

Added the option to set custom terrain cost.  So you can set a minimum and a maximum range, and set the value within that range.

Fixed issue with newly created terrain, making a change, then hitting undo. Instead of undoing the move, it was undoing the create.

Allowed tokens causing difficult terrain and dead tokens causing difficult terrain to work idependantly. 

Allow terrain height to use decimal numbers.

Fixed issue where Enhanced Terrain layer was resetting the scroll position after a change.

# Version 1.0.36

Well... this is embarassing.  I guess in the effort to get modules up to date, I forgot to include a template.  Should be fixed now.

# Version 1.0.35

Adding v9 support

# Version 1.0.34

Fixing issues with wrapping some functions.

# Version 1.0.33

Fixed issue with terrain being created that doesn't have the minimum number of points.

Fixed issue with dashedPolygon.

Added more support for consistency with other layers.

Added opacity to individual scenes

Fixed issue with Terrain HUD not updating the cost when using the up and down arrows

Added libWrapper support

Added German translations, thank you BlueSkyBlackBird!

# Version 1.0.32

Added support for Levels module

Fixing issue with relative URLs, thank you vexofp

Added Korean support, thank you drdwing

# Version 1.0.31
Added option to ignore snap to grid when calculating cost

Added option to not show border

Added option to change the picture shown

# Version 1.0.30
Split terrainAt into two functions terrainFromPixel and terrainFromGrid to make it more understandable.

Fixed the text in the terrain config dialog to reflect that it's the active state and not the hidden state that's changing.

Changes to the README file to correct some errors, Thank you caewok!

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
