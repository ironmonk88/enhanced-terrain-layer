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
        return this.terrain.shape;
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
        const left = 0;
        const top = 0;
        const right = left + this.token.data.width * canvas.grid.w;
        const bottom = top + this.token.data.height * canvas.grid.h;
        return new PIXI.Polygon(left, top, right, top, right, bottom, left, bottom);
    }
}