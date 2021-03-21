import { TerrainLayer } from './terrainlayer.js';

export class TerrainLayerToolBar extends FormApplication {
    constructor() {
        super(...arguments);
    }
    static get defaultOptions() {
        const options = {
            classes: ['form'],
            left: 98,
            popOut: false,
            template: 'modules/terrainlayer-v2/templates/terrain-controls.html',
            id: 'terrainlayer-config',
            title: game.i18n.localize('Default Terrain Cost'),
            closeOnSubmit: false,
            submitOnChange: false,
            submitOnClose: false
        };
        options['editable'] = game.user.isGM;
        return mergeObject(super.defaultOptions, options);
    }

    activateListeners(html) {
        super.activateListeners(html);

        $('.control-tool[data-tool]', html).on("click", this._onHandleClick.bind(this));
    }

    getData(options) {
        return { multiple: canvas.terrain.defaultmultiple };
    }

    _onHandleClick(event) {
        const btn = event.currentTarget;
        let idx = TerrainLayer.multipleOptions.indexOf(canvas.terrain.defaultmultiple);
        idx = Math.clamped(($(btn).attr('id') == 'tl-inc-cost' ? idx + 1 : idx - 1), 0, TerrainLayer.multipleOptions.length - 1);
        canvas.terrain.defaultmultiple = TerrainLayer.multipleOptions[idx];
        $('#tl-defaultcost', this.element).html(TerrainLayer.multipleText(canvas.terrain.defaultmultiple));
    }
}