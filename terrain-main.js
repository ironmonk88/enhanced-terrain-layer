import { TerrainLayer } from './classes/terrainlayer.js';
import { TerrainHUD } from './classes/terrainhud.js';
import { registerSettings } from "./js/settings.js";

export let debug = (...args) => {
	if (debugEnabled > 1) console.log("DEBUG: Enhanced Terrain Layer | ", ...args);
};
export let log = (...args) => console.log("Enhanced Terrain Layer | ", ...args);
export let warn = (...args) => {
	if (debugEnabled > 0) console.warn("Enhanced Terrain Layer | ", ...args);
};
export let error = (...args) => console.error("Enhanced Terrain Layer | ", ...args);

export let i18n = key => {
	return game.i18n.localize(key);
};

export let setting = key => {
	return game.settings.get("enhanced-terrain-layer", key);
};

function registerLayer() {
	const layers = mergeObject(Canvas.layers, {
		terrain: TerrainLayer
	});
	Object.defineProperty(Canvas, 'layers', {
		get: function () {
			return layers;
		}
	});
}

export function makeid() {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < 16; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

Hooks.on('canvasInit', () => {
	canvas.hud.terrain = new TerrainHUD();
	//Scene.constructor.config.embeddedEntities.Terrain = "terrain";
});

Hooks.on('init', () => {
	game.socket.on('module.enhanced-terrain-layer', async (data) => {
		console.log(data);
		canvas.terrain[data.action].apply(canvas.terrain, data.arguments);
	});

	registerSettings();
	registerLayer();

	let oldOnDragLeftStart = Token.prototype._onDragLeftStart;
	Token.prototype._onDragLeftStart = function (event) {
		oldOnDragLeftStart.apply(this, [event])
		if (canvas != null)
			canvas.terrain.visible = (canvas.grid.type != 0);
	}

	let oldOnDragLeftDrop = Token.prototype._onDragLeftDrop;
	Token.prototype._onDragLeftDrop = function (event) {
		if (canvas != null)
			canvas.terrain.visible = (canvas.grid.type != 0 && (canvas.terrain.showterrain || ui.controls.activeControl == 'terrain'));
		oldOnDragLeftDrop.apply(this, [event]);
	}
	let oldOnDragLeftCancel = Token.prototype._onDragLeftCancel;
	Token.prototype._onDragLeftCancel = function (event) {
		//event.stopPropagation();
		const ruler = canvas.controls.ruler;

		if (canvas != null && !(ruler.isDragRuler || ruler._state === Ruler.STATES.MEASURING))
			canvas.terrain.visible = (canvas.grid.type != 0 && (canvas.terrain.showterrain || ui.controls.activeControl == 'terrain'));

		oldOnDragLeftCancel.apply(this, [event])
	}

	//let handleDragCancel = MouseInteractionManager.prototype._handleDragCancel;

	/*
	MouseInteractionManager.prototype._handleDragCancel = function (event) {
		if (canvas != null) 
			canvas.terrain.highlight.children[0].visible = (canvas.terrain.showterrain || ui.controls.activeControl == 'terrain');
		handleDragCancel.apply(this, [event])
	}*/
})

Hooks.on('renderMeasuredTemplateConfig', (config, html, data) => {
	let widthRow = $('input[name="width"]', html).parent();
	let tlrow = $('<div>').addClass('form-group')
		.append($('<label>').html('Movement Cost'))
		.append($('<input>').attr('type', 'number').attr('name', 'flags.enhanced-terrain-layer.multiple').attr('data-type', 'Number').val(config.object.getFlag('enhanced-terrain-layer', 'multiple')))
		.insertAfter(widthRow);

	let height = $(html).height();
	$(html).css({height: height + 30});
})

Hooks.on('canvasReady', () => {
	canvas.terrain._costGrid = null;
});
