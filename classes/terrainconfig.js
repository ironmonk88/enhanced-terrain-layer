import { TerrainLayer, terraintype, environment } from './terrainlayer.js';
import { log, setting, i18n} from '../terrain-main.js';

export class TerrainConfig extends FormApplication {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "terrain-config",
            classes: ["sheet", "terrain-sheet"],
            title: i18n("EnhancedTerrainLayer.Configuration"),
            template: "modules/enhanced-terrain-layer/templates/terrain-config.html",
            width: 400,
            submitOnChange: true
        });
    }

    /* -------------------------------------------- */

    /** @override */
    getData(options) {
        return {
            object: duplicate(this.object.data),
            options: this.options,
            terraintype: terraintype,
            environment: environment,
            submitText: this.options.preview ? "Create" : "Update"
        }
    }

    /* -------------------------------------------- */

    /** @override */
    _onChangeInput(event) {
        if ($(event.target).attr('name') == 'multiple') {
            let val = $(event.target).val();
            $(event.target).next().html(TerrainLayer.multipleText(val));
        }
    }

    /* -------------------------------------------- */

    /** @override */
    async _updateObject(event, formData) {
        if (!game.user.isGM) throw "You do not have the ability to configure a Terrain object.";
        if (this.object.id) {
            let data = duplicate(formData);
            data._id = this.object.id;
            data.multiple = (data.multiple == 0 ? 0.5 : parseInt(data.multiple));
            return this.object.update(data);
        }
        return this.object.constructor.create(formData);
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
}

Hooks.on("renderTerrainConfig", (app, html) => {
    $('[name="terraintype"]', html).val(app.object.data.terraintype);
    $('[name="environment"]', html).val(app.object.data.environment);
})