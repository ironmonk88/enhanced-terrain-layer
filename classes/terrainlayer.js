import { Terrain } from './terrain.js';
import { TerrainConfig } from './terrainconfig.js';
import { TerrainHUD } from './terrainhud.js';
import { makeid, log, error, i18n, setting } from '../terrain-main.js';

export let terraintype = key => {
    return canvas.terrain.terraintype();
};

export let environment = key => {
    return canvas.terrain.environment();
};

export class TerrainLayer extends PlaceablesLayer {
    constructor() {
        super();
        this.showterrain = game.settings.get("enhanced-terrain-layer", "showterrain");
        this.defaultmultiple = 2;
    }

    /** @override */
    static get layerOptions() {
        return mergeObject(super.layerOptions, {
            zIndex: 15,
            canDragCreate: game.user.isGM,
            canDelete: game.user.isGM,
            controllableObjects: game.user.isGM,
            rotatableObjects: false,
            objectClass: Terrain,
            sheetClass: TerrainConfig
        });
    }

    get gridPrecision() {
        let size = canvas.dimensions.size;
        if (size >= 128) return 16;
        else if (size >= 64) return 8;
        else if (size >= 32) return 4;
        else if (size >= 16) return 2;
    }

    static get multipleOptions() {
        return [0.5, 1, 2, 3, 4];
    }

    terraintype() {
        return [{ id: 'ground', text: 'Ground' }, { id: 'air', text: 'Air Only' }, { id: 'both', text: 'Air & Ground' }];
    }

    environment() {
        return [
            { id: '', text: '' },
            { id: 'arctic', text: 'Arctic' },
            { id: 'coast', text: 'Coast' },
            { id: 'desert', text: 'Desert' },
            { id: 'forest', text: 'Forest' },
            { id: 'grassland', text: 'Grassland' },
            { id: 'mountain', text: 'Mountain' },
            { id: 'swamp', text: 'Swamp' },
            { id: 'underdark', text: 'Underdark' },
            { id: 'water', text: 'Water' }
        ];
    }

    static multipleText(multiple) {
        return (parseInt(multiple) == 0 || parseInt(multiple) == 0.5 ? '1/2' : multiple);
    }

/* -------------------------------------------- */

    get costGrid() {
        console.warn('costGrid is deprecated, please use the cost function instead');
        if (this._costGrid == undefined) {
            this.buildCostGrid(canvas.terrain.placeables);
        }
        return this._costGrid;
    }

    cost(pts, options = {}) {
        let details = this.costDetails(pts, options);
        return details.cost;
    }

    costDetails(pts, options = {}) {
        let reduceFn = function (cost, reduce) {
            let value = parseFloat(reduce.value);

            if (typeof reduce.value == 'string' && (reduce.value.startsWith('+') || reduce.value.startsWith('-'))) {
                value = cost + value;
                if (reduce.stop) {
                    if (reduce.value.startsWith('+'))
                        value = Math.min(value, reduce.stop);
                    else
                        value = Math.max(value, reduce.stop);
                }
            }

            return Math.max(value, 0);
        }

        let details = [];
        let total = 0;
        pts = pts instanceof Array ? pts : [pts];

        const hx = canvas.grid.w / 2;
        const hy = canvas.grid.h / 2;

        let calculate = options.calculate || 'maximum';
        let calculateFn = function (cost, total) { return cost; };
        if (typeof calculate == 'function')
            calculateFn = calculate;
        else {
            switch (calculate) {
                case 'maximum':
                    calculateFn = function (cost, total) { return Math.max(cost, total); }; break;
                case 'additive':
                    calculateFn = function (cost, total) { return cost + total; }; break;
            }
        }

        for (let pt of pts) {
            let cost = null;
            let [gx, gy] = canvas.grid.grid.getPixelsFromGridPosition(pt.y, pt.x);

            let elevation = (options.elevation === false ? null : (options.elevation != undefined ? options.elevation : options?.token?.data?.elevation));
            let tokenId = options.tokenId || options?.token?.id;

            //get the cost for the terrain layer
            for (let terrain of this.placeables) {
                const testX = (gx + hx) - terrain.data.x;
                const testY = (gy + hy) - terrain.data.y;
                if (terrain.multiple != 1 &&
                    !options.ignore?.includes(terrain.environment) &&
                    !((terrain.data.terraintype == 'ground' && elevation > 0) || (terrain.data.terraintype == 'air' && elevation <= 0)) &&
                    terrain.shape.contains(testX, testY)) {
                    let detail = {object:terrain};
                    let terraincost = terrain.cost(options);
                    detail.cost = terraincost;

                    let reduce = options.reduce?.find(e => e.id == terrain.environment);
                    if (reduce) {
                        detail.reduce = reduce;
                        terraincost = reduceFn(terraincost, reduce);
                    }
                    cost = calculateFn(terraincost, cost, terrain);
                    detail.total = cost;

                    details.push(detail);

                }
            }

            //get the cost for any measured templates, ie spells
            for (let measure of canvas.templates.placeables) {
                const testX = (gx + hx) - measure.data.x;
                const testY = (gy + hy) - measure.data.y;
                let terraincost = measure.getFlag('enhanced-terrain-layer', 'multiple');													  
                let measType = measure.getFlag('enhanced-terrain-layer', 'terraintype') || 'ground';
                let measEnv = measure.getFlag('enhanced-terrain-layer', 'environment') || '';
                if (terraincost &&
                    !options.ignore?.includes(measEnv) &&
                    !((measType == 'ground' && elevation > 0) || (measType == 'air' && elevation <= 0)) &&
                    measure.shape.contains(testX, testY)) {

                    let detail = { object: measure, cost: terraincost };
                    let reduce = options.reduce?.find(e => e.id == measEnv);
                    if (reduce) {
                        detail.reduce = reduce;
                        terraincost = reduceFn(terraincost, reduce);
                    }

                    cost = calculateFn(terraincost, cost, measure);
                    detail.total = cost;

                    details.push(detail);

                }
            }

			if (setting("tokens-cause-difficult")) {
				//get the cost for walking through another creatures square
				for (let token of canvas.tokens.placeables) {
					if (token.id != tokenId && !token.data.hidden && (elevation == undefined || token.data.elevation == elevation)) {
						const testX = (gx + hx);
						const testY = (gy + hy);
						if (!(testX < token.data.x || testX > token.data.x + (token.data.width * canvas.grid.w) || testY < token.data.y || testY > token.data.y + (token.data.height * canvas.grid.h))) {
                            let terraincost = 2;
                            let detail = { object: token, cost: terraincost };

                            let reduce = options.reduce?.find(e => e.id == 'token');
                            if (reduce) {
                                detail.reduce = reduce;
                                terraincost = reduceFn(terraincost, reduce);
                            }

                            cost = calculateFn(terraincost, cost, token);
                            detail.total = cost;

                            details.push(detail);
						}
					}
				}
			}

            total += (cost != undefined ? cost : 1);
        }

        return { cost: total, details: details, calculate: calculate };
    }

    terrainAt(x, y) {
        const hx = canvas.grid.w / 2;
        const hy = canvas.grid.h / 2;
        let [gx, gy] = canvas.grid.grid.getPixelsFromGridPosition(y, x);
        let terrains = this.placeables.filter(t => {
            const testX = (gx + hx) - t.data.x;
            const testY = (gy + hy) - t.data.y;
            return t.shape.contains(testX, testY);
        });

        return terrains;
    }

    /**
     * Tile objects on this layer utilize the TileHUD
     * @type {TerrainHUD}
     */
    get hud() {
        return canvas.hud.terrain;
    }

    async draw() {
        canvas.scene.data.terrain = [];
        let etl = canvas.scene.data.flags['enhanced-terrain-layer'];
        if (etl) {
            for (let [k, v] of Object.entries(etl)) {
                if (k.startsWith('terrain')) {
                    if (k != 'terrainundefined' && v != undefined && v.x != undefined && v.y != undefined)
                        if (v.points != undefined)
                            canvas.scene.data.terrain.push(v);
                    else
                            await canvas.scene.unsetFlag('enhanced-terrain-layer', k);
                }
            };
        }

        const d = canvas.dimensions;
        this.width = d.width;
        this.height = d.height;
        this.hitArea = d.rect;
        this.zIndex = this.constructor.layerOptions.zIndex;

        // Create objects container which can be sorted
        this.objects = this.addChild(new PIXI.Container());
        this.objects.sortableChildren = true;
        this.objects.visible = false;

        // Create preview container which is always above objects
        this.preview = this.addChild(new PIXI.Container());

        // Create and draw objects
        const promises = canvas.scene.data.terrain.map(data => {
            const obj = this.createObject(data);
            return obj.draw();
        });

        // Wait for all objects to draw
        this.visible = true;
        return Promise.all(promises || []);
    }

    async buildCostGrid(data) {
        this._costGrid = {};
        for (let terrain of data) {
            const grid = canvas.grid;
            const d = canvas.dimensions;

            // Get number of rows and columns
            const nr = Math.ceil(terrain.data.height / grid.h);//Math.ceil(((terrain.height * 1.5) / d.distance) / (d.size / grid.h));
            const nc = Math.ceil(terrain.data.width / grid.w);//Math.ceil(((terrain.width * 1.5) / d.distance) / (d.size / grid.w));

            // Get the offset of the terrain origin relative to the top-left grid space
            const [tx, ty] = canvas.grid.getTopLeft(terrain.data.x, terrain.data.y);
            const [row0, col0] = grid.grid.getGridPositionFromPixels(tx, ty);
            const hx = canvas.grid.w / 2;
            const hy = canvas.grid.h / 2;

            // Identify grid coordinates covered by the template Graphics
            for (let r = 0; r < nr; r++) {
                for (let c = 0; c < nc; c++) {
                    let tr = row0 + r;
                    let tc = col0 + c;
                    let [gx, gy] = canvas.grid.grid.getPixelsFromGridPosition(tr, tc);
                    const testX = (gx + hx) - terrain.x;
                    const testY = (gy + hy) - terrain.y;
                    let contains = terrain.shape.contains(testX, testY);
                    if (!contains) continue;
                    if (typeof this._costGrid[tr] === 'undefined')
                        this._costGrid[tr] = {};
                    this._costGrid[tr][tc] = { multiple: terrain.multiple, type: terrain.type };
                }
            }
        }
    }

    async toggle(show, emit = false) {
        if (show == undefined)
            show = !this.showterrain;
        this.showterrain = show;
        canvas.terrain.visible = this.showterrain;
        if (game.user.isGM) {
            game.settings.set("enhanced-terrain-layer", "showterrain", this.showterrain);
            if (emit)
                game.socket.emit('module.enhanced-terrain-layer', { action: 'toggle', arguments: [this.showterrain] })
        }
    }

    deactivate() {
        super.deactivate();
        if (this.objects) this.objects.visible = true;
    }

    async updateMany(data, options = {diff: true}) {
        const user = game.user;

        const pending = new Map();
        data = data instanceof Array ? data : [data];
        for (let d of data) {
            if (!d._id) throw new Error("You must provide an id for every Embedded Entity in an update operation");
            pending.set(d._id, d);
        }

        // Difference each update against existing data
        let updates = canvas.scene.data.terrain.reduce((arr, d) => {
            if (!pending.has(d._id)) return arr;
            let update = pending.get(d._id);

            // Diff the update against current data
            if (options.diff) {
                update = diffObject(d, expandObject(update));
                if (isObjectEmpty(update)) return arr;
                update["_id"] = d._id;
            }

            // Call pre-update hooks to ensure the update is allowed to proceed
            if (!options.noHook) {
                const allowed = Hooks.call(`preUpdateTerrain`, this, d, update, options, user._id);
                if (allowed === false) {
                    debug(`Terrain update prevented by preUpdate hook`);
                    return arr;
                }
            }

            // Stage the update
            arr.push(update);
            return arr;
        }, []);
        if (!updates.length) return [];

        let flags = {};
        for (let u of updates) {
            let key = `flags.enhanced-terrain-layer.terrain${u._id}`;
            flags[key] = u;
        }

        this._costGrid = null;

        canvas.scene.update(flags).then(() => {
            this.updateTerrain(updates);
        });
    }

    updateTerrain(data, options) {
        data = data instanceof Array ? data : [data];
        for (let update of data) {
            let terrain = this.placeables.find(t => { return t.id == update._id });
            if (terrain != undefined)
                terrain.update(update, { save: false });
        }
        if (game.user.isGM) {
            game.socket.emit('module.enhanced-terrain-layer', { action: 'updateTerrain', arguments: [data]});
        }
    }

    async deleteMany(ids, options = {}) {
        //+++ need to update this to only respond to actual deletions

        let updates = {};
        let originals = [];
        for (let id of ids) {
            const object = this.get(id);
            log('Removing terrain', object.data.x, object.data.y);
            if(!options.isUndo)
                originals.push(object.data);
            this.objects.removeChild(object);
            delete this._controlled[id];
            object._onDelete(options, game.user.id);
            object.destroy({ children: true });
            canvas.scene.data.terrain.findSplice(t => { return t._id == id; });
            let key = `flags.enhanced-terrain-layer.-=terrain${id}`;
            updates[key] = null;

            if (game.user.isGM)
                game.socket.emit('module.enhanced-terrain-layer', { action: 'deleteTerrain', arguments: [id] });
        }

        if (!options.isUndo)
            this.storeHistory("delete", originals);

        this._costGrid = null;

        canvas.scene.update(updates);
    }

    _getNewTerrainData(origin) {
        const data = mergeObject(Terrain.defaults, {
            x: origin.x,
            y: origin.y,
            points: [[0,0]]
        });
        return data;
    }

    /* -------------------------------------------- */
    /*  Event Listeners and Handlers                */
    /* -------------------------------------------- */

    /** @override */
    _onClickLeft(event) {
        const { preview, createState, originalEvent } = event.data;

        // Continue polygon point placement
        if (createState >= 1 && preview instanceof Terrain) {
            let point = event.data.destination;
            if (!originalEvent.shiftKey) point = canvas.grid.getSnappedPosition(point.x, point.y, this.gridPrecision);
            preview._addPoint(point, false);
            preview._chain = true; // Note that we are now in chain mode
            return preview.refresh();
        }

        // Standard left-click handling
        super._onClickLeft(event);
    }

    /* -------------------------------------------- */

    /** @override */
    _onClickLeft2(event) {
        const { createState, preview } = event.data;

        // Conclude polygon placement with double-click
        if (createState >= 1) {
            event.data.createState = 2;
            return this._onDragLeftDrop(event);
        }

        // Standard double-click handling
        super._onClickLeft2(event);
    }

    /* -------------------------------------------- */

    /** @override */
    _onDragLeftStart(event) {
        super._onDragLeftStart(event);
        const data = this._getNewTerrainData(event.data.origin);
        const terrain = new Terrain(data);

        event.data.preview = this.preview.addChild(terrain);
        terrain.draw();
    }

    /* -------------------------------------------- */

    /** @override */
    _onDragLeftMove(event) {
        const { preview, createState } = event.data;
        if (!preview) return;
        if (preview.parent === null) { // In theory this should never happen, but rarely does
            this.preview.addChild(preview);
        }
        if (createState >= 1) {
            preview._onMouseDraw(event);
        }
    }

    /* -------------------------------------------- */

    /**
     * Handling of mouse-up events which conclude a new object creation after dragging
     * @private
     */
    _onDragLeftDrop(event) {
        const { createState, destination, origin, preview } = event.data;

        // Successful drawing completion
        if (createState === 2) {
            const distance = Math.hypot(destination.x - origin.x, destination.y - origin.y);
            const minDistance = distance >= (canvas.dimensions.size / this.gridPrecision);
            const completePolygon = (preview.data.points.length > 2);

            // Create a completed terrain
            if (minDistance || completePolygon) {
                event.data.createState = 0;
                const data = preview.data;

                // Adjust the final data
                const createData = Terrain.normalizeShape(data);

                // Create the object
                preview._chain = false;
                preview.constructor.create(createData).then(d => {
                    d._creating = true;
                    if (game.user.isGM) {
                        game.socket.emit('module.enhanced-terrain-layer', { action: 'createTerrain', arguments: [createData] });
                    }
                });
            }

            // Cancel the preview
            return this._onDragLeftCancel(event);
        }

        // In-progress polygon
        if (createState === 1) {
            event.data.originalEvent.preventDefault();
            if (preview._chain) return;
            return this._onClickLeft(event);
        }

        // Incomplete drawing
        return this._onDragLeftCancel(event);
    }

    /* -------------------------------------------- */

    /** @override */
    _onDragLeftCancel(event) {
        const preview = this.preview.children?.[0] || null;
        if (preview?._chain) {
            preview._removePoint();
            preview.refresh();
            if (preview.data.points.length) return event.preventDefault();
        }
        super._onDragLeftCancel(event);
    }

    /* -------------------------------------------- */

    /** @override */
    _onClickRight(event) {
        const preview = this.preview.children?.[0] || null;
        if (preview) return canvas.mouseInteractionManager._dragRight = false;
        super._onClickRight(event);
    }
    /*
    _onDragSelect(event) {
        // Extract event data
        const { origin, destination } = event.data;

        // Determine rectangle coordinates
        let coords = {
            x: Math.min(origin.x, destination.x),
            y: Math.min(origin.y, destination.y),
            width: Math.abs(destination.x - origin.x),
            height: Math.abs(destination.y - origin.y)
        };

        // Draw the select rectangle
        canvas.controls.drawSelect(coords);
        event.data.coords = coords;
    }*/

    pasteObjects(position, { hidden = false, snap = true } = {}) {
        if (!this._copy.length) return [];

        // Adjust the pasted position for half a grid space
        if (snap) {
            position.x -= canvas.dimensions.size / 2;
            position.y -= canvas.dimensions.size / 2;
        }

        // Get the left-most object in the set
        this._copy.sort((a, b) => a.data.x - b.data.x);
        let { x, y } = this._copy[0].data;

        // Iterate over objects
        const toCreate = [];
        for (let c of this._copy) {
            let data = duplicate(c.data);
            let dest = { x: position.x + (data.x - x), y: position.y + (data.y - y) };
            if (snap) dest = canvas.grid.getSnappedPosition(dest.x, dest.y);
            delete data._id;
            toCreate.push(Terrain.normalizeShape(mergeObject(data, {
                x: dest.x,
                y: dest.y,
                hidden: data.hidden || hidden
            })));
        }

        // Call paste hooks
        Hooks.call(`pasteTerrain`, this._copy, toCreate);

        // Create the object
        let created = toCreate.map((data) => {
            return Terrain.create(data).then(d => {
                d._creating = true;
                if (game.user.isGM) {
                    game.socket.emit('module.enhanced-terrain-layer', { action: 'createTerrain', arguments: [data] });
                }
            });
        });

        ui.notifications.info(`Pasted data for ${toCreate.length} Terrain objects.`);
        created = created instanceof Array ? created : [created];
        return created.map(c => this.get(c._id));
    }

    /*
    selectObjects({ x, y, width, height, releaseOptions = {}, controlOptions = {} } = {}) {
        const oldSet = Object.values(this._controlled);

        let sPt = canvas.grid.grid.getGridPositionFromPixels(x, y);
        let [y1, x1] = sPt;  //Normalize the returned data because it's in [y,x] format
        let dPt = canvas.grid.grid.getGridPositionFromPixels(x + width, y + height);
        let [y2, x2] = dPt;  //Normalize the returned data because it's in [y,x] format

        // Identify controllable objects
        const controllable = this.placeables.filter(obj => obj.visible && (obj.control instanceof Function));
        const newSet = controllable.filter(obj => {
            return !(obj.data.x < x1 || obj.data.x > x2 || obj.data.y < y1 || obj.data.y > y2);
        });

        // Release objects no longer controlled
        const toRelease = oldSet.filter(obj => !newSet.includes(obj));
        toRelease.forEach(obj => obj.release(releaseOptions));

        // Control new objects
        if (isObjectEmpty(controlOptions)) controlOptions.releaseOthers = false;
        const toControl = newSet.filter(obj => !oldSet.includes(obj));
        toControl.forEach(obj => obj.control(controlOptions));

        // Return a boolean for whether the control set was changed
        const changed = (toRelease.length > 0) || (toControl.length > 0);
        if (changed) canvas.initializeSources();
        return changed;
    }*/

    /*
    createTerrain(data, options = { }) {
        if (!this.terrainExists(data.x, data.y)) {
            data.multiple = data.multiple || this.defaultmultiple;
            this.constructor.placeableClass.create(data, options).then((terrain) => {
                if (this.originals != undefined)
                    this.originals.push(terrain);
            });
        }
        this._costGrid = null;
    }*/
    /*
    terrainExists(pxX, pxY) {
        return canvas.scene.data.terrain.find(t => { return t.x == pxX && t.y == pxY }) != undefined;
    }*/


    //This is used for players, to add an remove on the fly
    createTerrain(data, options = {}) {
        let userId = game.user._id;
        let object = canvas.terrain.createObject(data);
        object._onCreate(options, userId);
        canvas.scene.data.terrain.push(data);
    }

    deleteTerrain(id, options = {}) {
        const object = this.get(id);
        this.objects.removeChild(object);
        object._onDelete(options, game.user.id);
        object.destroy({ children: true });
        canvas.scene.data.terrain.findSplice(t => { return t._id == id; });
    }
}
