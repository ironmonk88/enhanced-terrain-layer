Hooks.on('getSceneControlButtons', (controls) => {
	if (game.user.isGM && canvas != null) {
	    controls.push({
			name: 'terrain',
			title: game.i18n.localize('TerrainLayer.sf'),
			icon: 'fas fa-mountain',
			layer: 'TerrainLayer',
			activeTool: 'addterrain',
			tools: [
				{
					name: 'selectterrain',
					title: 'TerrainLayer.select',
					icon: 'fas fa-expand'
				},
				{
					name: 'addterrain',
					title: 'TerrainLayer.add',
					icon: 'fas fa-marker'
				},
				{
					name: 'clearterrain',
					title: game.i18n.localize('TerrainLayer.reset'),
					icon: 'fas fa-trash',
					onClick: () => {
						const dg = new Dialog({
							title: game.i18n.localize('TerrainLayer.reset'),
							content: game.i18n.localize('TerrainLayer.confirmReset'),
							buttons: {
								reset: {
									icon: '<i class="fas fa-trash"></i>',
									label: 'Reset',
									callback: () => canvas.terrain.resetGrid(true),
								},
								cancel: {
									icon: '<i class="fas fa-times"></i>',
									label: 'Cancel',
								}
							},
							default: 'cancel',
						});
						dg.render(true);
					},
					button: true,
				},
				{
					name: 'terraintoggle',
					title: game.i18n.localize('TerrainLayer.onoff'),
					icon: 'fas fa-eye',
					onClick: () => {
						canvas.terrain.toggle(null, true);
					},
					active: canvas.terrain.showterrain,
					toggle: true
				}
			],
			activeTool:'addterrain'
	  	})
	}
	//show the terrain if show button is toggled, or if the current tool is the terrain tool
	//canvas.terrain.highlight.children[0].visible = (canvas.terrain.showterrain || controls["terrain"].active);
});
Hooks.on('renderSceneControls', (controls) => {
	if(canvas != null)
		canvas.terrain.highlight.children[0].visible = (canvas.terrain.showterrain || controls.activeControl == 'terrain');
});
Hooks.on('init',()=>{
	game.settings.register('TerrainLayer', 'scale', {
		name: "TerrainLayer.scale-s",
		hint: "TerrainLayer.scale-l",
		scope: "world",
		config: true,
		default: 1,
		type: Number,
		range: {
			min: 0.4,
			max: 1,
			step: 0.1
		},
		onChange: () => {
			canvas.terrain.buildFromCostGrid();
		}
	});
	game.settings.register('TerrainLayer', 'opacity', {
		name: "TerrainLayer.opacity-s",
		hint: "TerrainLayer.opacity-l",
		scope: "world",
		config: true,
		default: 1,
		type: Number,
		range: {
			min: 0.3,
			max: 1,
			step: 0.1
		},
		onChange: () => {
			canvas.terrain.buildFromCostGrid();
		}
	});
	game.settings.register('TerrainLayer', 'maxMultiple', {
		name: "TerrainLayer.multiple-s",
		hint: "TerrainLayer.multiple-l",
		scope: "world",
		config: true,
		default: 3,
		type: Number
	});
	game.settings.register('TerrainLayer', 'showText', {
		name: "TerrainLayer.showtext-s",
		hint: "TerrainLayer.showtext-l",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});
})