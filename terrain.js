import {TerrainLayer} from './classes/terrainlayer.js';

let theLayers = Canvas.layers;
theLayers.terrain = TerrainLayer;

Hooks.on('init',()=>{
	game.socket.on('module.TerrainLayer', async (data) => {
		console.log(data)
		canvas.terrain[data.action].apply(canvas.terrain, data.arguments);
	});

	let oldOnDragLeftStart = Token.prototype._onDragLeftStart;
	Token.prototype._onDragLeftStart = function (event) {
		oldOnDragLeftStart.apply(this, [event])
		if (canvas != null)
			canvas.terrain.highlight.children[0].visible = true;
	}

	let oldOnDragLeftDrop = Token.prototype._onDragLeftDrop;
	Token.prototype._onDragLeftDrop = function (event) {
		if (canvas != null)
			canvas.terrain.highlight.children[0].visible = (canvas.terrain.showterrain || ui.controls.activeControl == 'terrain');
		oldOnDragLeftDrop.apply(this, [event]);
	}
	let oldOnDragLeftCancel = Token.prototype._onDragLeftCancel;
	Token.prototype._onDragLeftCancel = function (event) {
		event.stopPropagation();
		if (canvas != null)
			canvas.terrain.highlight.children[0].visible = (canvas.terrain.showterrain || ui.controls.activeControl == 'terrain');

		oldOnDragLeftCancel.apply(this, [event])
	}
	let handleDragCancel = MouseInteractionManager.prototype._handleDragCancel;

	MouseInteractionManager.prototype._handleDragCancel = function (event) {
		if (canvas != null) 
			canvas.terrain.highlight.children[0].visible = (canvas.terrain.showterrain || ui.controls.activeControl == 'terrain');
		handleDragCancel.apply(this, [event])
	}
})

Object.defineProperty(Canvas, 'layers', {get: function() {
	return theLayers;
}})
