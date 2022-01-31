import { TerrainLayer } from './terrainlayer.js';
import { setting, i18n } from '../terrain-main.js';

export class TerrainLayerToolBar extends FormApplication {
    constructor() {
        super(...arguments);
    }
    static get defaultOptions() {
        const options = {
            classes: ['form'],
            left: 98,
            popOut: false,
            template: 'modules/enhanced-terrain-layer/templates/terrain-controls.html',
            id: 'terrainlayer-config',
            title: i18n('Default Terrain Cost'),
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
        let sceneMult = canvas.scene.getFlag('enhanced-terrain-layer', 'multiple');
        let multiple = (sceneMult == undefined || sceneMult == "" ? canvas.terrain.defaultmultiple : Math.clamped(parseInt(sceneMult), setting('minimum-cost'), setting('maximum-cost')))
        return {
            multiple: TerrainLayer.multipleText(multiple),
            disabled: !(sceneMult == undefined || sceneMult == "")
        };
    }

    _onHandleClick(event) {
        const btn = event.currentTarget;

        let inc = ($(btn).attr('id') == 'tl-inc-cost');
        canvas.terrain.defaultmultiple = TerrainLayer.alterMultiple(canvas.terrain.defaultmultiple, inc);
        $('#tl-defaultcost', this.element).html(TerrainLayer.multipleText(canvas.terrain.defaultmultiple));

        /*
        let idx = TerrainLayer.multipleOptions.indexOf(canvas.terrain.defaultmultiple);
        idx = Math.clamped(($(btn).attr('id') == 'tl-inc-cost' ? idx + 1 : idx - 1), 0, TerrainLayer.multipleOptions.length - 1);
        canvas.terrain.defaultmultiple = TerrainLayer.multipleOptions[idx];
        $('#tl-defaultcost', this.element).html(TerrainLayer.multipleText(canvas.terrain.defaultmultiple));
        */
    }
}