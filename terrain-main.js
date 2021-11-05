import { TerrainLayer } from './classes/terrainlayer.js';
import { TerrainHUD } from './classes/terrainhud.js';
import { TerrainConfig } from './classes/terrainconfig.js';
import { Terrain } from './classes/terrain.js';
import { BaseTerrain, TerrainDocument } from './classes/terraindocument.js';
import { registerSettings } from "./js/settings.js";

export let debug = (...args) => {
	console.log("DEBUG: Enhanced Terrain Layer | ", ...args);
};
export let log = (...args) => console.log("Enhanced Terrain Layer | ", ...args);
export let warn = (...args) => {
	console.warn("Enhanced Terrain Layer | ", ...args);
};
export let error = (...args) => console.error("Enhanced Terrain Layer | ", ...args);

export let i18n = key => {
	return game.i18n.localize(key);
};

export let setting = key => {
	return game.settings.get("enhanced-terrain-layer", key);
};

function registerLayer() {
	CONFIG.Canvas.layers.terrain = TerrainLayer;
	CONFIG.Terrain = {
		documentClass: TerrainDocument,
		layerClass: TerrainLayer,
		sheetClass: TerrainConfig,
		objectClass: Terrain
	};

	let oldCreateEmbeddedDocuments = Scene.prototype.createEmbeddedDocuments;
	Scene.prototype.createEmbeddedDocuments = async function (embeddedName, updates = [], context = {}) {
		if (embeddedName == 'Terrain') {
			context.parent = this;
			context.pack = this.pack;
			return TerrainDocument.createDocuments(updates, context);
		} else
			return oldCreateEmbeddedDocuments.call(this, embeddedName, updates, context);
	}

	let oldUpdateEmbeddedDocuments = Scene.prototype.updateEmbeddedDocuments;
	Scene.prototype.updateEmbeddedDocuments = async function (embeddedName, updates = [], context = {}) {
		if (embeddedName == 'Terrain') {
			context.parent = this;
			context.pack = this.pack;
			return TerrainDocument.updateDocuments(updates, context);
		} else
			return oldUpdateEmbeddedDocuments.call(this, embeddedName, updates, context);
	}

	let oldDeleteEmbeddedDocuments = Scene.prototype.deleteEmbeddedDocuments;
	Scene.prototype.deleteEmbeddedDocuments = async function (embeddedName, ids, context = {}) {
		if (embeddedName == 'Terrain') {
			context.parent = this;
			context.pack = this.pack;
			return TerrainDocument.deleteDocuments(ids, context);
		} else
			return oldDeleteEmbeddedDocuments.call(this, embeddedName, ids, context);
	}

	Object.defineProperty(Scene.prototype, "terrain", {
		get: function terrain() {
			return this.data.terrain;
		}
	});
}

/*
async function checkUpgrade() {
	let hasInformed = false;
	let inform = function () {
		if (!hasInformed) {
			ui.notifications.info('Converting old TerrainLayer data, please wait');
			hasInformed = true;
		}
	}

	for (let scene of game.scenes.entries) {
		if (scene.data.flags?.TerrainLayer) {
			let gW = scene.data.grid;
			let gH = scene.data.grid;

			let data = duplicate(scene.data.flags?.TerrainLayer);
			for (let [k, v] of Object.entries(data)) {
				if (k == 'costGrid') {
					let grid = scene.getFlag('TerrainLayer', 'costGrid');
					for (let y in grid) {
						for (let x in grid[y]) {
							//if (Object.values(data).find(t => { return t.x == (parseInt(x) * gW) && t.y == (parseInt(y) * gH); }) == undefined) {
								inform();
								let id = makeid();
								let data = { _id: id, x: parseInt(x) * gW, y: parseInt(y) * gH, points: [[0, 0], [gW, 0], [gW, gH], [0, gH], [0, 0]], width: gW, height: gH, multiple: grid[y][x].multiple };
								await scene.setFlag('enhanced-terrain-layer', 'terrain' + id, data);
							//}
						}
					}
				}
			};
		}
	}

	if (hasInformed)
		ui.notifications.info('TerrainLayer conversion complete.');
}*/

export function makeid() {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < 16; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

function addControls(app, html, addheader) {
	let multiple = app.object.getFlag("enhanced-terrain-layer", "multiple") || 1;
	let cost = $('<div>').addClass('form-group')
		.append($('<label>').html(i18n("EnhancedTerrainLayer.TerrainCost")))
		.append($('<div>').addClass('form-fields')
			.append($('<input>')
				.attr({ 'type': 'range', 'dtype': 'Number', 'min': '1', 'max': '4', 'step': '1', 'name': 'flags.enhanced-terrain-layer.multiple' })
				.val(multiple))
			//.on('change', function () { $(this).next().html(TerrainLayer.multipleText($(this).val())) }))
			.append($('<span>').addClass('range-value').css({ 'flex': '0 1 48px' }).html(multiple))
		)

	//add the terrain type
	let type = $('<div>').addClass('form-group')
		.append($('<label>').html(i18n("EnhancedTerrainLayer.TerrainHeight")))
		.append($('<div>')
			.addClass('form-fields')
			.append($('<label>').addClass('terrainheight-label').html(i18n("EnhancedTerrainLayer.Min")))
			.append($('<input>').attr({ type: 'number', name: 'flags.enhanced-terrain-layer.min', 'data-type': 'Number' }).val(app.object.getFlag('enhanced-terrain-layer', 'min') || 0))
			.append($('<label>').addClass('terrainheight-label').html(i18n("EnhancedTerrainLayer.Max")))
			.append($('<input>').attr({ type: 'number', name: 'flags.enhanced-terrain-layer.max', 'data-type': 'Number' }).val(app.object.getFlag('enhanced-terrain-layer', 'max') || 0))
			)
			/*
			.append($('<select>')
				.attr('name', 'flags.enhanced-terrain-layer.terraintype')
				.attr('data-type', 'String')
				.append(function () { return canvas.terrain.getTerrainTypes().map(v => { return $('<option>').attr('value', v.id).html(i18n(v.text)); }) })
				.val(app.object.getFlag('enhanced-terrain-layer', 'terraintype') || 'ground')));*/

	//add the environment
	var obs = [];
	var env = canvas.terrain.getEnvironments().reduce(function (map, obj) {
		let opt = $('<option>').attr('value', obj.id).html(i18n(obj.text));
		(obj.obstacle === true ? obs : map).push(opt);
		return map;
	}, []);

	let envGroup = (env.length > 0 ? $('<optgroup>').attr('label', i18n("EnhancedTerrainLayer.Environment")).append(env) : '');
	let obsGroup = (obs.length > 0 ? $('<optgroup>').attr('label', i18n("EnhancedTerrainLayer.Obstacle")).append(obs) : '');
	let environment = $('<div>').addClass('form-group')
		.append($('<label>').html(i18n("EnhancedTerrainLayer.Environment")))
		.append($('<div>').addClass('form-fields')
			.append($('<select>')
				.attr('name', 'flags.enhanced-terrain-layer.environment')
				.attr('data-type', 'String')
				.append($('<option>').attr('value', '').html(''))
				.append(envGroup)
				.append(obsGroup)
				.val(app.object.getFlag('enhanced-terrain-layer', 'environment'))));

	let ctrl = $('[name="flags.mess.templateTexture"], [name="texture"],[name="data.target.units"],[name="data.range.value"],[name="backgroundColor"]', html);
	if (ctrl.length > 0) {
		let group = ctrl.get(0).closest(".form-group");
		if (group) {
			environment.insertAfter(group);
			type.insertAfter(group);
			cost.insertAfter(group);
			if (addheader)
				$('<h3>').addClass("form-header").append($('<i>').addClass("fas fa-mountain fa-fw")).append(" Terrain Configuration").insertAfter(group);
		}
	}
}

Hooks.on('canvasInit', () => {
	canvas.hud.terrain = new TerrainHUD();
	//Scene.constructor.config.embeddedEntities.Terrain = "terrain";
});

Hooks.on('ready', () => {
	/*
	if (game.user.isGM && !setting('conversion')) {
		checkUpgrade();
		game.settings.set('enhanced-terrain-layer', 'conversion', true);
	}*/

	window.setTimeout(function () {
		if (canvas.terrain.getObstacles != undefined && !canvas.terrain.updateObstacles) {
			warn('getObstacles is deprecated, please use getEnvironment and set the obstacle property to true');

			let obstacles = canvas.terrain.getObstacles().map(t => {
				t.obstacle = true;
				return t;
			});
			let environments = canvas.terrain.getEnvironments().concat(obstacles);

			canvas.terrain.getEnvironments = function () {
				return environments;
			}

			canvas.terrain.updateObstacles = true;
		}
	}, 100);
})

Hooks.on('init', async () => {
	game.socket.on('module.enhanced-terrain-layer', async (data) => {
		console.log(data);
		canvas.terrain[data.action].apply(canvas.terrain, data.arguments);
	});

	registerSettings();
	registerLayer();

	//remove old layer's controls
	let oldGetControlButtons = SceneControls.prototype._getControlButtons;
	SceneControls.prototype._getControlButtons = function () {
		let controls = oldGetControlButtons();
		controls.findSplice(c => c.name == 'terrain' && c.flags == undefined);
		return controls;
	}

	let oldOnDragLeftStart = Token.prototype._onDragLeftStart;
	Token.prototype._onDragLeftStart = function (event) {
		oldOnDragLeftStart.apply(this, [event])
		if (canvas != null)
			canvas.terrain.visible = (canvas.terrain.showterrain || ui.controls.activeControl == 'terrain' || setting('show-on-drag'));
	}

	let oldOnDragLeftDrop = Token.prototype._onDragLeftDrop;
	Token.prototype._onDragLeftDrop = function (event) {
		if (canvas != null)
			canvas.terrain.visible = (canvas.terrain.showterrain || ui.controls.activeControl == 'terrain' || setting('show-on-drag'));
		oldOnDragLeftDrop.apply(this, [event]);
	}
	let oldOnDragLeftCancel = Token.prototype._onDragLeftCancel;
	Token.prototype._onDragLeftCancel = function (event) {
		//event.stopPropagation();
		const ruler = canvas.controls.ruler;

		log('ruler', ruler);
		if (canvas != null && ruler._state !== Ruler.STATES.MEASURING)
			canvas.terrain.visible = (canvas.terrain.showterrain || ui.controls.activeControl == 'terrain');

		oldOnDragLeftCancel.apply(this, [event])
	}

	//let handleDragCancel = MouseInteractionManager.prototype._handleDragCancel;

	/*
	MouseInteractionManager.prototype._handleDragCancel = function (event) {
		if (canvas != null) 
			canvas.terrain.highlight.children[0].visible = (canvas.terrain.showterrain || ui.controls.activeControl == 'terrain');
		handleDragCancel.apply(this, [event])
	}*/

	if (game.system.id == 'dnd5e') {
		let fromItem = function(wrapped, ...args) {
			const [item] = args;
			const template = wrapped(...args);
			if (!template) {
				return template;
			}
			let etldata = item.data?.flags["enhanced-terrain-layer"]; //get all the enhanced terrain flags
			if (etldata) {
				let data = { flags: { 'enhanced-terrain-layer': etldata }};
				template.data.update(data);
			}
			return template;
		}

		if (game.modules.get("lib-wrapper")?.active) {
			libWrapper.register("enhanced-terrain-layer", "game.dnd5e.canvas.AbilityTemplate.fromItem", fromItem, "WRAPPER");
		} else {
			const origFromItem = game.dnd5e.canvas.AbilityTemplate.fromItem;
			game.dnd5e.canvas.AbilityTemplate.fromItem = function () {
				return fromItem.call(this, origFromItem.bind(this), ...arguments);
			}
		}
	}
})

Hooks.on('renderMeasuredTemplateConfig', (config, html, data) => {
	addControls(config, html);

	let height = $(html).height();
	$(html).css({ height: height + 90});
})

/*
Hooks.on('canvasReady', () => {
	canvas.terrain._costGrid = null;
});*/

Hooks.on("renderSceneConfig", (app, html, data) => {
	let backgroundRow = $('input[name="backgroundColor"]', html).parent().parent();

	let defaultColor = app.object.getFlag('enhanced-terrain-layer', 'defaultcolor') || setting('environment-color')['_default'] || '#FFFFFF';

	//add default color
	$('<div>').addClass('form-group')
		.append($('<label>').html(i18n("EnhancedTerrainLayer.DefaultTerrainColor")))
		.append($('<div>').addClass('form-fields')
			.append($('<input>').attr('type', 'text').attr('name', 'flags.enhanced-terrain-layer.defaultcolor').attr('data-dtype', 'String').val(defaultColor))
			.append($('<input>').attr('type', 'color').attr('data-edit', 'flags.enhanced-terrain-layer.defaultcolor').val(defaultColor)))
		.insertAfter(backgroundRow);

	//add the environment
	addControls(app, html, true);
});

Hooks.on("renderSceneConfig", (app, html) => {
	canvas.terrain.refresh(true);	//refresh the terrain to respond to default terrain color
});

Hooks.on("renderItemSheet", (app, html) => {
	if(app.object.type == 'spell')
		addControls(app, html);
});

Hooks.on("controlToken", (app, html) => {
	canvas.terrain.refresh();
});
