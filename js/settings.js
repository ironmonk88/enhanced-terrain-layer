import { TerrainColor } from "../classes/terraincolor.js";

export const registerSettings = function () {
	let modulename = "enhanced-terrain-layer";

	const debouncedReload = foundry.utils.debounce(function () { window.location.reload(); }, 100);

	let imageoptions = {
		'solid': 'Solid',
		'diagonal': 'Diagonal',
		'oldschool': 'Old School',
		'triangle': 'Triangle',
		'horizontal': 'Horizontal',
		'vertical': 'Vertical',
		'clear': 'Clear'
	};

	game.settings.registerMenu(modulename, 'edit-colors', {
		name: 'Edit Colors',
		label: 'Edit Colors',
		hint: 'Edit default color, environment colrs, and obstacle colors',
		icon: 'fas fa-palette',
		restricted: true,
		type: TerrainColor,
		onClick: (value) => {
		}
	});

	game.settings.register(modulename, 'opacity', {
		name: "EnhancedTerrainLayer.opacity.name",
		hint: "EnhancedTerrainLayer.opacity.hint",
		scope: "world",
		config: true,
		default: 1,
		type: Number,
		range: {
			min: 0,
			max: 1,
			step: 0.1
		},
		onChange: () => {
			canvas.terrain.refresh();
		}
	});
	game.settings.register(modulename, 'draw-border', {
		name: "EnhancedTerrainLayer.draw-border.name",
		hint: "EnhancedTerrainLayer.draw-border.hint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
		onChange: () => {
			canvas.terrain.refresh();
		}
	});
	game.settings.register(modulename, 'terrain-image', {
		name: "EnhancedTerrainLayer.terrain-image.name",
		hint: "EnhancedTerrainLayer.terrain-image.hint",
		scope: "world",
		config: true,
		default: 'diagonal',
		type: String,
		choices: imageoptions,
		onChange: debouncedReload
	});
	game.settings.register(modulename, 'show-text', {
		name: "EnhancedTerrainLayer.show-text.name",
		hint: "EnhancedTerrainLayer.show-text.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		onChange: () => {
			canvas.terrain.refresh();
		}
	});
	game.settings.register(modulename, 'show-icon', {
		name: "EnhancedTerrainLayer.show-icon.name",
		hint: "EnhancedTerrainLayer.show-icon.hint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
		onChange: () => {
			canvas.terrain.refresh();
		}
	});
	game.settings.register(modulename, 'show-on-drag', {
		name: "EnhancedTerrainLayer.show-on-drag.name",
		hint: "EnhancedTerrainLayer.show-on-drag.hint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	});
	game.settings.register(modulename, 'only-show-active', {
		name: "EnhancedTerrainLayer.only-show-active.name",
		hint: "EnhancedTerrainLayer.only-show-active.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		onChange: () => {
			canvas.terrain.refresh();
		}
	});
	game.settings.register(modulename, 'tokens-cause-difficult', {
		name: "EnhancedTerrainLayer.tokens-cause-difficult.name",
		hint: "EnhancedTerrainLayer.tokens-cause-difficult.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});
	game.settings.register(modulename, 'dead-cause-difficult', {
		name: "EnhancedTerrainLayer.dead-cause-difficult.name",
		hint: "EnhancedTerrainLayer.dead-cause-difficult.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});
	game.settings.register(modulename, 'use-obstacles', {
		name: "EnhancedTerrainLayer.use-obstacles.name",
		hint: "EnhancedTerrainLayer.use-obstacles.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});
	game.settings.register(modulename, 'minimum-cost', {
		name: "EnhancedTerrainLayer.minimum-cost.name",
		hint: "EnhancedTerrainLayer.minimum-cost.hint",
		scope: "world",
		config: true,
		default: 0.5,
		type: Number
	});
	game.settings.register(modulename, 'maximum-cost', {
		name: "EnhancedTerrainLayer.maximum-cost.name",
		hint: "EnhancedTerrainLayer.maximum-cost.hint",
		scope: "world",
		config: true,
		default: 4,
		type: Number
	});
	game.settings.register(modulename, 'showterrain', {
		scope: "world",
		config: false,
		default: false,
		type: Boolean
	});

	game.settings.register(modulename, 'conversion', {
		scope: "world",
		config: false,
		default: false,
		type: Boolean
	});

	game.settings.register(modulename, 'environment-color', {
		scope: "world",
		config: false,
		default: {},
		type: Object
	});
};