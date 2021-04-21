import { log, error, i18n, setting } from "../terrain-main.js";

export class TerrainColor extends FormApplication {
    constructor(object, options) {
        super(object, options);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "terraincolor",
            title: i18n("EnhancedTerrainLayer.TerrainColor"),
            template: "./modules/enhanced-terrain-layer/templates/terrain-color.html",
            width: 400,
            height: 400,
            popOut: true
        });
    }

    getData(options) {
        let colors = setting('environment-color');

        let environmentColor = canvas.terrain.getEnvironments().map(c => {
            if (colors[c.id] != undefined)
                c.color = colors[c.id];
            return c;
        });

        let obstacleColor = canvas.terrain.getObstacles().map(c => {
            if (colors[c.id] != undefined)
                c.color = colors[c.id];
            return c;
        });

        return {
            main: colors['_default'] || { id:'_default', color:'#FFFFFF'},
            environment: environmentColor,
            obstacle: obstacleColor
        };
    }

    saveChanges(ev) {
        log('submit');

        let colors = setting('environment-color');
        let updateColor = function (id, value) {
            if (value == '') {
                delete colors[id];
            } else {
                colors[id] = value;
            }
        }

        updateColor('_default', $('#_default', this.element).val());

        for (let env of canvas.terrain.getEnvironments()) {
            updateColor(env.id, $('#' + env.id, this.element).val());
        }

        for (let obs of canvas.terrain.getObstacles()) {
            updateColor(obs.id, $('#' + obs.id, this.element).val());
        }

        game.settings.set('enhanced-terrain-layer', 'environment-color', colors).then(() => {
            canvas.terrain.refresh(true);
        });

        this.close();
    }

    resetSetting() {
        game.settings.set('enhanced-terrain-layer', 'environment-color', {'_default':'#FFFFFF'});
        this.render(true);
    }

    activateListeners(html) {
        super.activateListeners(html);

        $('button[name="reset"]', html).click(this.resetSetting.bind(this));
        $('button[name="submit"]', html).click(this.saveChanges.bind(this));
    }
}