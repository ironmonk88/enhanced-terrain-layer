import { TerrainLayer } from './terrainlayer.js';
import { setting, i18n, getflag } from '../terrain-main.js';

export class TerrainLayerToolBar extends Application {
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

        $('.control-btn[data-tool]', html).on("click", this._onHandleClick.bind(this));
    }

    getData(options) {
        let sceneMult = getflag(canvas.scene, 'multiple');
        let multiple = (sceneMult == undefined || sceneMult == "" ? canvas.terrain.defaultmultiple : Math.clamped(parseInt(sceneMult), setting('minimum-cost'), setting('maximum-cost')));
        let disabled = !(sceneMult == undefined || sceneMult == "");
        return {
            multiple: TerrainLayer.multipleText(multiple),
            disabled: disabled,
            title: (disabled ? i18n("EnhancedTerrainLayer.DefaultCost") : i18n("EnhancedTerrainLayer.Cost"))
        };
    }

    _onHandleClick(event) {
        const btn = event.currentTarget;

        let inc = ($(btn).attr('id') == 'tl-inc-cost');
        canvas.terrain.defaultmultiple = TerrainLayer.alterMultiple(canvas.terrain.defaultmultiple, inc);
        $('#tl-defaultcost', this.element).html(TerrainLayer.multipleText(canvas.terrain.defaultmultiple));
    }

    async _render(...args) {
        await super._render(...args);
        $('#controls').append(this.element);
    }
}