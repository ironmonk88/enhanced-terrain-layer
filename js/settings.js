export const registerSettings = function () {
	let modulename = "enhanced-terrain-layer";

	game.settings.register(modulename, 'opacity', {
		name: "EnhancedTerrainLayer.opacity.name",
		hint: "EnhancedTerrainLayer.opacity.hint",
		scope: "world",
		config: true,
		default: 1,
		type: Number,
		range: {
			min: 0.5,
			max: 1,
			step: 0.1
		}
	});
	game.settings.register(modulename, 'showText', {
		name: "EnhancedTerrainLayer.showText.name",
		hint: "EnhancedTerrainLayer.showText.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});
	game.settings.register(modulename, 'tokens-cause-difficult', {
		name: "EnhancedTerrainLayer.tokens-cause-difficult.name",
		hint: "EnhancedTerrainLayer.tokens-cause-difficult.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
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
};