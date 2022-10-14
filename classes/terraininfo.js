import { makeid, log, setting, debug, getflag } from '../terrain-main.js';
import { TerrainLayer } from './terrainlayer.js';

class TerrainInfo {
    constructor(reducers) {
        if (this.constructor === TerrainInfo) {
            throw new Error("TerrainInfo is an abstract class and cannot be directly instantiated");
        }
        this.reducers = reducers;
    }

    get cost() {
        let terraincost = this.rawCost;
        if (!this.reducers)
            return terraincost;
        for (const reduce of this.reducers) {
            let value = parseFloat(reduce.value);

            if (typeof reduce.value == 'string' && (reduce.value.startsWith('+') || reduce.value.startsWith('-'))) {
                value = terraincost + value;
                if (reduce.stop) {
                    if (reduce.value.startsWith('+'))
                        value = Math.min(value, reduce.stop);
                    else
                        value = Math.max(value, reduce.stop);
                }
            }
            terraincost = value; //Math.max(value, 0);
        }
        return terraincost;
    }

    get object() {
        throw new Error("The getter 'object' must be implemented by subclasses of TerrainInfo");
    }

    get rawCost() {
        throw new Error("The getter 'rawCost' must be implemented by subclasses of TerrainInfo");
    }

    get shape() {
        throw new Error("The getter 'shape' must be implemented by subclasses of TerrainInfo");
    }

    get environment() {
        throw new Error("The getter 'environment' must be implemented by subclasses of TerrainInfo");
    }

    get obstacle() {
        throw new Error("The getter 'obstracle' must be implemented by subclasses of TerrainInfo");
    }
}

export class PolygonTerrainInfo extends TerrainInfo {
    constructor(terrain, reducers) {
        super(reducers);
        this.terrain = terrain;
    }

    get object() {
        return this.terrain;
    }

    get rawCost() {
        return this.terrain.cost();
    }

    get shape() {
        return this.terrain.shape._pixishape;
    }

    get environment() {
        return this.terrain.document.environment;
    }

    get obstacle() {
        return this.terrain.document.obstacle;
    }
}

export class TemplateTerrainInfo extends TerrainInfo {
    constructor(template, reducers) {
        super(reducers);
        this.template = template;
    }

    get object() {
        return this.template;
    }

    get rawCost() {
        return this.template.data.flags['enhanced-terrain-layer'].multiple;
    }

    get shape() {
        return this.template.shape;
    }

    get environment() {
        return this.template.flags["enhanced-terrain-layer"]?.environment;
    }

    get obstacle() {
        return this.template.flags["enhanced-terrain-layer"]?.obstacle;
    }
}

export class TokenTerrainInfo extends TerrainInfo {
    constructor(token, reducers) {
        super(reducers);
        this.token = token;
    }

    get object() {
        return this.token;
    }

    get rawCost() {
        return 2;
    }

    get shape() {
        if (canvas.grid.type == CONST.GRID_TYPES.GRIDLESS) {
            const hw = (this.token.document.width * canvas.dimensions.size) / 2;
            const hh = (this.token.document.height * canvas.dimensions.size) / 2;
            
            return new PIXI.Circle(hw, hh, Math.max(hw, hh));
        } else {
            const left = 0;
            const top = 0;
            const width = this.token.document.width * canvas.dimensions.size;
            const height = this.token.document.height * canvas.dimensions.size;

            return new PIXI.Rectangle(left, top, width, height);
        }
    }

    get environment() {
        return undefined;
    }

    get obstacle() {
        return undefined;
    }
}