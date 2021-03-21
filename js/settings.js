export const registerSettings = function () {
	let modulename = "terrainlayer-v2";

	game.settings.register(modulename, 'opacity', {
		name: "TerrainLayerV2.opacity.name",
		hint: "TerrainLayerV2.opacity.hint",
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
		name: "TerrainLayerV2.showText.name",
		hint: "TerrainLayerV2.showText.hint",
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
};