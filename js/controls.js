import { TerrainLayerToolBar } from '../classes/terraincontrols.js';

Hooks.on('getSceneControlButtons', (controls) => {
	const isGM = game.user.isGM;
	controls.push({
		name: 'terrain',
		title: game.i18n.localize('TerrainLayerV2.tool'),
		icon: 'fas fa-mountain',
		visible: isGM && (canvas?.grid?.type !== 0),
		layer: 'TerrainLayer',
		activeTool: 'select',
		tools: [
			{
				name: 'select',
				title: game.i18n.localize('TerrainLayerV2.select'),
				icon: 'fas fa-expand'
			},
			{
				name: 'addterrain',
				title: game.i18n.localize('TerrainLayerV2.add'),
				icon: 'fas fa-marker'
			},
			{
				name: 'terraintoggle',
				title: game.i18n.localize('TerrainLayerV2.onoff'),
				icon: 'fas fa-eye',
				onClick: () => {
					canvas.terrain.toggle(null, true);
				},
				active: (canvas?.terrain?.showterrain || game.settings.get("terrainlayer-v2", "showterrain")),
				toggle: true
			},
			{
				name: 'clearterrain',
				title: game.i18n.localize('TerrainLayerV2.reset'),
				icon: 'fas fa-trash',
				visible: isGM,
				onClick: () => {
					canvas.terrain.deleteAll()
				},
				button: true,
			}
		]
	});
	//show the terrain if show button is toggled, or if the current tool is the terrain tool
	//canvas.terrain.highlight.children[0].visible = (canvas.terrain.showterrain || controls["terrain"].active);
});
Hooks.on('renderSceneControls', (controls) => {
	if (canvas != null) {
		canvas.terrain.visible = (canvas.terrain.showterrain || controls.activeControl == 'terrain');

		if (controls.activeControl == 'terrain') {
			if (canvas.terrain.toolbar == undefined)
				canvas.terrain.toolbar = new TerrainLayerToolBar();
			canvas.terrain.toolbar.render(true);
			//$('#terrainlayer-tools').toggle(controls.activeTool == 'addterrain');
		} else {
			if (!canvas.terrain.toolbar)
				return;
			canvas.terrain.toolbar.close();
		}
	}
});
Hooks.on('renderTerrainLayerToolBar', () => {
	const tools = $(canvas.terrain.toolbar.form).parent();
	if (!tools)
		return;
	const controltools = $('li[data-control="terrain"] ol.control-tools');
	const offset = controltools.offset();
	tools.css({ top: `${offset.top}px`, left: `${offset.left + controltools.width() + 6}px` });
});