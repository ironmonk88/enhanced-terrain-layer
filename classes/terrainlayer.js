import { Terrain } from './terrain.js';
import { TerrainConfig } from './terrainconfig.js';
import { TerrainHUD } from './terrainhud.js';
import { TerrainDocument, TerrainData } from './terraindocument.js';
import { PolygonTerrainInfo, TemplateTerrainInfo, TokenTerrainInfo } from './terraininfo.js';
import { makeid, log, debug, warn, error, i18n, setting, getflag } from '../terrain-main.js';
import EmbeddedCollection from "../../../common/abstract/embedded-collection.mjs";

export let environments = key => {
    return canvas.terrain.getEnvironments();
};

export class TerrainLayer extends PlaceablesLayer {
    constructor() {
        super();
        this._showterrain = game.settings.get("enhanced-terrain-layer", "showterrain");
        this.defaultmultiple = 2;

        this._setting = {};
    }

    static documentName = "Terrain";

    /** @override */
    static get layerOptions() {
        return mergeObject(super.layerOptions, {
            zIndex: 35, //15,
            canDragCreate: game.user.isGM,
            canDelete: game.user.isGM,
            controllableObjects: game.user.isGM,
            rotatableObjects: false,
            objectClass: Terrain,
            //sheetClass: TerrainConfig,
            sheetClasses: {
                base: {
                    "enhanced-terrain-layer.TerrainSheet": {
                        id: "enhanced-terrain-layer.TerrainSheet",
                        label: "Enhanced Terrain Sheet",
                        "default": true,
                        cls: TerrainConfig
                    }
                }
            }
        });
    }

    getDocuments() {
        return canvas.scene?.data.terrain || null;
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

    getEnvironments() {
        let environments = [
            { id: 'arctic', text: 'EnhancedTerrainLayer.environment.arctic', icon: 'modules/enhanced-terrain-layer/img/environment/arctic.png' },
            { id: 'coast', text: 'EnhancedTerrainLayer.environment.coast', icon: 'modules/enhanced-terrain-layer/img/environment/coast.png' },
            { id: 'desert', text: 'EnhancedTerrainLayer.environment.desert', icon: 'modules/enhanced-terrain-layer/img/environment/desert.png' },
            { id: 'forest', text: 'EnhancedTerrainLayer.environment.forest', icon: 'modules/enhanced-terrain-layer/img/environment/forest.png' },
            { id: 'grassland', text: 'EnhancedTerrainLayer.environment.grassland', icon: 'modules/enhanced-terrain-layer/img/environment/grassland.png' },
            { id: 'jungle', text: 'EnhancedTerrainLayer.environment.jungle', icon: 'modules/enhanced-terrain-layer/img/environment/jungle.png' },
            { id: 'mountain', text: 'EnhancedTerrainLayer.environment.mountain', icon: 'modules/enhanced-terrain-layer/img/environment/mountain.png' },
            { id: 'swamp', text: 'EnhancedTerrainLayer.environment.swamp', icon: 'modules/enhanced-terrain-layer/img/environment/swamp.png' },
            { id: 'underdark', text: 'EnhancedTerrainLayer.environment.underdark', icon: 'modules/enhanced-terrain-layer/img/environment/underdark.png' },
            { id: 'urban', text: 'EnhancedTerrainLayer.environment.urban', icon: 'modules/enhanced-terrain-layer/img/environment/urban.png' },
            { id: 'water', text: 'EnhancedTerrainLayer.environment.water', icon: 'modules/enhanced-terrain-layer/img/environment/water.png' },

            { id: 'crowd', text: 'EnhancedTerrainLayer.obstacle.crowd', icon: 'modules/enhanced-terrain-layer/img/environment/crowd.png', obstacle: true },
            { id: 'current', text: 'EnhancedTerrainLayer.obstacle.current', icon: 'modules/enhanced-terrain-layer/img/environment/current.png', obstacle: true },
            { id: 'furniture', text: 'EnhancedTerrainLayer.obstacle.furniture', icon: 'modules/enhanced-terrain-layer/img/environment/furniture.png', obstacle: true },
            { id: 'magic', text: 'EnhancedTerrainLayer.obstacle.magic', icon: 'modules/enhanced-terrain-layer/img/environment/magic.png', obstacle: true },
            { id: 'plants', text: 'EnhancedTerrainLayer.obstacle.plants', icon: 'modules/enhanced-terrain-layer/img/environment/plants.png', obstacle: true },
            { id: 'rubble', text: 'EnhancedTerrainLayer.obstacle.rubble', icon: 'modules/enhanced-terrain-layer/img/environment/rubble.png', obstacle: true }
        ];

        Hooks.call(`getTerrainEnvironments`, this, environments);

        return environments;
    }

    static multipleText(multiple) {
        return (parseFloat(multiple) == 0.5 ? '&frac12;' : multiple);
    }

    static alterMultiple(multiple, increase = true) {
        let step = 1;
        if (multiple < 1 || (multiple == 1 && !increase))
            step = 0.5;

        let newmult = multiple + (step * (increase ? 1 : -1));
        if (newmult >= 1)
            newmult = parseInt(newmult);
        else
            newmult = Math.round(newmult * 2) / 2;

        newmult = Math.clamped(newmult, setting('minimum-cost'), setting('maximum-cost'))

        return newmult;
    }

    //Do not touch these as other modules rely on them
    get showOnDrag() {
        return setting('show-on-drag');
    }

    get showterrain() {
        return this._showterrain;
    }

    set showterrain(value) {
        this._showterrain = value;
        canvas.terrain.visible = this._showterrain;
        if (game.user.isGM)
            game.settings.set("enhanced-terrain-layer", "showterrain", this._showterrain);
    }

    elevation(pts, options = {}) {
        pts = pts instanceof Array ? pts : [pts];

        let results = [];
        const hx = (canvas.grid.type == CONST.GRID_TYPES.GRIDLESS || options.ignoreGrid === true ? 0 : canvas.grid.w / 2);
        const hy = (canvas.grid.type == CONST.GRID_TYPES.GRIDLESS || options.ignoreGrid === true ? 0 : canvas.grid.h / 2);

        for (let pt of pts) {
            let cost = null;
            let [gx, gy] = (canvas.grid.type == CONST.GRID_TYPES.GRIDLESS || options.ignoreGrid === true ? [pt.x, pt.y] : canvas.grid.grid.getPixelsFromGridPosition(pt.y, pt.x));

            let tx = (gx + hx);
            let ty = (gy + hy);

            //get the cost for the terrain layer
            for (let terrain of this.placeables) {
                const testX = tx - terrain.data.x;
                const testY = ty - terrain.data.y;
                if (terrain?.shape?.contains(testX, testY)) {
                    results.push({ top: terrain.top, bottom: terrain.bottom, terrain: terrain });
                }
            }
        }

        return results;
    }

    calcElevationFromOptions(options) {
        return (options.elevation === false ? null : (options.elevation != undefined ? options.elevation : options?.token?.data?.elevation));
    }

    listTerrain(options = {}) {
        const useObstacles = setting('use-obstacles');
        const elevation = this.calcElevationFromOptions(options);

        const terrainInfos = options.list || [];
        for (const terrain of this.placeables) {
            if (elevation < terrain.bottom || elevation > terrain.top)
                continue;
            if (terrain.multiple == 1)
                continue;
            if (options.ignore?.includes(terrain.data.environment))
                continue;
            let reducers = options.reduce?.filter(e => e.id == terrain.data.environment || (useObstacles && e.id == terrain.obstacle));
            terrainInfos.push(new PolygonTerrainInfo(terrain, reducers));
        }
        return terrainInfos;
    }

    listMeasuredTerrain(options = {}) {
        const useObstacles = setting('use-obstacles');
        const elevation = this.calcElevationFromOptions(options);

        const terrainInfos = options.list || [];
        for (const template of canvas.templates.placeables) {
            const terrainFlag = template.data.flags['enhanced-terrain-layer'];
            if (!terrainFlag)
                continue;
            const terraincost = terrainFlag.multiple ?? 1;
            const terrainbottom = terrainFlag.elevation ?? Terrain.defaults.elevation;
            const terraintop = terrainbottom + (terrainFlag.depth ?? Terrain.defaults.depth);
            const environment = terrainFlag.environment || '';
            if (elevation < terrainbottom || elevation > terraintop)
                continue;
            if (terraincost == 1)
                continue;
            if (options.ignore?.includes(environment))
                continue;
            let reducers = options.reduce?.filter(e => e.id == terrain.data.environment || (useObstacles && e.id == terrain.obstacle));
            terrainInfos.push(new TemplateTerrainInfo(template, reducers));
        }
        return terrainInfos;
    }

    listTokenTerrain(options = {}) {
        const terrainInfos = options.list || [];

        let isDead = options.isDead || function (token) {
            return !!token.actor?.effects?.find(e => {
                const core = e.data.flags["core"];
                return core && core["statusId"] === CONFIG.Combat.defeatedStatusId; 
            });
        }

        if ((setting("tokens-cause-difficult") || setting("dead-cause-difficult")) && canvas.grid.type != CONST.GRID_TYPES.GRIDLESS && !options.ignore?.includes("tokens")) {
            const elevation = this.calcElevationFromOptions(options);
            const tokenId = options.tokenId || options?.token?.id;
            for (const token of canvas.tokens.placeables) {
                if (token.id == tokenId)
                    continue;
                if (token.data.hidden)
                    continue;
                if (elevation != undefined && token.data.elevation != elevation)
                    continue;
                let dead = isDead(token);
                if ((setting("dead-cause-difficult") && dead) || (setting("tokens-cause-difficult") && !dead)) {
                    let reducers = options.reduce?.filter(e => e.id == 'token')
                    terrainInfos.push(new TokenTerrainInfo(token, reducers));
                }
            }
        }

        return terrainInfos;
    }

    listAllTerrain(options = {}) {
        return this.listTokenTerrain({ list: this.listMeasuredTerrain({ list: this.listTerrain(options), ...options }), ...options })
    }

    costWithTerrain(pts, terrain, options = {}) {
        pts = pts instanceof Array ? pts : [pts];

        const hx = (canvas.grid.type == CONST.GRID_TYPES.GRIDLESS || options.ignoreGrid === true ? 0 : canvas.grid.w / 2);
        const hy = (canvas.grid.type == CONST.GRID_TYPES.GRIDLESS || options.ignoreGrid === true ? 0 : canvas.grid.h / 2);

        let calculate = options.calculate || 'maximum';
        let calculateFn;
        if (typeof calculate == 'function')
            calculateFn = calculate;
        else {
            switch (calculate) {
                case 'maximum':
                    calculateFn = function (cost, total) { return Math.max(cost, total); }; break;
                case 'additive':
                    calculateFn = function (cost, total) { return cost + total; }; break;
                default:
                    throw new Error(i18n("EnhancedTerrainLayer.ErrorCalculate"));
            }
        }

        const details = [];
        let total = 0;
        for (const pt of pts) {
            let cost = null;
            const [gx, gy] = (canvas.grid.type == CONST.GRID_TYPES.GRIDLESS || options.ignoreGrid === true ? [pt.x, pt.y] : canvas.grid.grid.getPixelsFromGridPosition(pt.y, pt.x));

            const tx = (gx + hx);
            const ty = (gy + hy);

            for (const terrainInfo of terrain) {
                const testX = tx - terrainInfo.object.data.x;
                const testY = ty - terrainInfo.object.data.y;

                if (!terrainInfo.shape.contains(testX, testY))
                    continue;

                const terraincost = terrainInfo.cost;
                if (typeof calculateFn == 'function')
                    cost = calculateFn(terraincost, cost, terrainInfo.object);
                
                const detail = {
                    cost: terrainInfo.rawCost,
                    object: terrainInfo.object,
                    reduce: terrainInfo.reducers,
                    total: cost,
                };
                details.push(detail);
            }

            total += (cost != undefined ? cost : 1);
        }

        if (options.verbose === true)
            return { cost: total, details: details, calculate: calculate };
        else
            return total;
    }

    cost(pts, options = {}) {
        const terrain = this.listAllTerrain(options);
        return this.costWithTerrain(pts, terrain, options);
    }

    terrainFromGrid(x, y) {
        let [gx, gy] = canvas.grid.grid.getPixelsFromGridPosition(y, x);
        return this.terrainFromPixels(gx, gy);
    }

    terrainFromPixels(x, y) {
        const hx = (x + (canvas.grid.w / 2));
        const hy = (y + (canvas.grid.h / 2));

        let terrains = this.placeables.filter(t => {
            const testX = hx - t.data.x;
            const testY = hy - t.data.y;
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
        canvas.scene.data.terrain = new EmbeddedCollection(canvas.scene.data, [], Terrain);
        let etl = canvas.scene.data.flags['enhanced-terrain-layer'];
        if (etl) {
            for (let [k, v] of Object.entries(etl)) {
                if (k.startsWith('terrain')) {
                    if (k != 'terrainundefined' && v != undefined && v.x != undefined && v.y != undefined && v._id != undefined && v.points != undefined) {
                        //lets correct any changes
                        let change = false;
                        if (v.environment == '' && v.obstacle != '') {
                            v.environment = v.obstacle;
                            v.obstacle = '';
                            change = true;
                        }
                        if (v.elevation == undefined || v.depth == undefined) {
                            if (v.terrainheight != undefined && typeof v.terrainheight === 'string')
                                v.terrainheight = JSON.parse(v.terrainheight);
                            v.elevation = v.min || (v.terrainheight != undefined ? v.terrainheight.min : (v.terraintype == 'air' ? 5 : 0)) || 0;
                            let max = v.max || (v.terrainheight != undefined ? v.terrainheight.max : (v.terraintype == 'air' || v.terraintype == 'both' ? 100 : 0)) || 0;
                            v.depth = max - v.elevation;
                            change = true;
                        }

                        if (change)
                            await canvas.scene.setFlag('enhanced-terrain-layer', k, v);

                        //add this the the terrain collection
                        let document = new TerrainDocument(v, { parent: canvas.scene });
                        canvas.scene.data.terrain.set(v._id, document);
                    }
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

        const documents = this.getDocuments();
        const promises = documents.map(doc => { return doc.object.draw(); });

        // Wait for all objects to draw
        this.visible = true;
        await Promise.all(promises);
        return this;
    }

    async toggle(show, emit = false) {
        if (show == undefined)
            show = !this.showterrain;
        this.showterrain = show;
        if (game.user.isGM && emit)
            game.socket.emit('module.enhanced-terrain-layer', { action: 'toggle', arguments: [this._showterrain] });
    }

    deactivate() {
        //if (this.objects) {
            super.deactivate();
            if (this.objects) this.objects.visible = true;
        //}
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
        } else if (createState == 0 || createState == undefined) {
            //add a default square
            let gW = canvas.grid.w;
            let gH = canvas.grid.h;

            //let pos = canvas.grid.getSnappedPosition(event.data.origin.x, event.data.origin.y, 1);
            let [tX, tY] = canvas.grid.grid.getGridPositionFromPixels(event.data.origin.x, event.data.origin.y);
            let [gX, gY] = canvas.grid.grid.getPixelsFromGridPosition(tX, tY);

            let points = [];
            if (canvas.grid.type == CONST.GRID_TYPES.GRIDLESS || canvas.grid.type == CONST.GRID_TYPES.SQUARE)
                points = [[0, 0], [gW, 0], [gW, gH], [0, gH], [0, 0]];
            else if (canvas.grid.type == CONST.GRID_TYPES.HEXEVENR || canvas.grid.type == CONST.GRID_TYPES.HEXODDR) 
                points = [[gW / 2, 0], [gW, gH * 0.25], [gW, gH * 0.75], [gW / 2, gH], [0, gH * 0.75], [0, gH * 0.25], [gW / 2, 0]];
            else if (canvas.grid.type == CONST.GRID_TYPES.HEXEVENQ || canvas.grid.type == CONST.GRID_TYPES.HEXODDQ)
                points = [[0, gH / 2], [gW * 0.25, 0], [gW * 0.75, 0], [gW, gH / 2], [gW * 0.75, gH], [gW * 0.25, gH], [0, gH / 2]];

            const data = mergeObject(Terrain.defaults, {
                x: gX - (canvas.grid.type == CONST.GRID_TYPES.GRIDLESS ? (gW / 2) : 0),
                y: gY - (canvas.grid.type == CONST.GRID_TYPES.GRIDLESS ? (gH / 2) : 0),
                points: points,
                width: gW,
                height: gH
            });

            const document = new TerrainDocument(data, { parent: canvas.scene });

            this.createTerrain(document.data);
        }

        // Standard double-click handling
        super._onClickLeft2(event);
    }

    /* -------------------------------------------- */

    /** @override */
    _onDragLeftStart(event) {
        super._onDragLeftStart(event);
        const data = this._getNewTerrainData(event.data.origin);

        const document = new TerrainDocument(data, { parent: canvas.scene });
        const terrain = new Terrain(document);
        event.data.preview = this.preview.addChild(terrain);
        return terrain.draw();
    }

    /* -------------------------------------------- */

    /** @override */
    _onDragLeftMove(event) {
        const { preview, createState } = event.data;
        if (!preview) return;
        //if (preview.parent === null) { // In theory this should never happen, but rarely does
        //    this.preview.addChild(preview);
        //}
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
                this.createTerrain(data);
                preview._chain = false;
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

    async pasteObjects(position, { hidden = false, snap = true } = {}) {
        if (!this._copy.length) return [];
        const cls = this.constructor.placeableClass;
        const d = canvas.dimensions;

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
            let data = c.document.toObject();
            delete data._id;

            // Constrain the destination position
            let dest = { x: position.x + (data.x - x), y: position.y + (data.y - y) };
            dest.x = Math.clamped(dest.x, 0, d.width - 1);
            dest.y = Math.clamped(dest.y, 0, d.height - 1);
            if (snap) dest = canvas.grid.getSnappedPosition(dest.x, dest.y);

            let document = new TerrainDocument(Terrain.normalizeShape(mergeObject(data, {
                x: dest.x,
                y: dest.y,
                hidden: data.hidden || hidden
            })), { parent: canvas.scene });
            toCreate.push(document.data);
        }

        // Call paste hooks
        Hooks.call(`paste${cls.name}`, this._copy, toCreate);

        let created = await canvas.scene.createEmbeddedDocuments(this.constructor.documentName, toCreate);
        ui.notifications.info(`Pasted data for ${toCreate.length} ${this.constructor.documentName} objects.`);

        /*
        for (let terrain of created) {
            if (terrain.document._object == undefined) {
                terrain.document._object = new Terrain(terrain.document);
                canvas.terrain.objects.addChild(terrain.document._object);
                terrain.document._object.draw();
            }
        }*/

        return created;
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

    createTerrain(data) {
        //data = mergeObject(Terrain.defaults, data);
        const createData = Terrain.normalizeShape(data);

        const cls = getDocumentClass("Terrain");

        // Create the object
        return cls.create(createData, { parent: canvas.scene }); /*.then(d => {
            d._creating = true;
            if (d.document._object == undefined) {
                d.document._object = new Terrain(d.document);
                canvas.terrain.objects.addChild(d.document._object);
                d.document._object.draw();
            }
            return d;
        });*/
    }


    //This is used for players, to add an remove on the fly
    _createTerrain(data, options = {}) {
        let toCreate = data.map(d => new TerrainData(d));
        TerrainDocument.createDocuments(toCreate, { parent: canvas.scene });

        /*
        let toCreate = data.map(d => {
            const document = new TerrainDocument(d, { parent: canvas.scene });
            return document.data;
        });

        TerrainDocument.createDocuments();

        let userId = game.user._id;
        let object = canvas.terrain.createObject(data);
        object._onCreate(options, userId);
        canvas.scene.data.terrain.push(data);*/
    }

    _updateTerrain(data, options = {}) {
        TerrainDocument.updateDocuments(data, { parent: canvas.scene });
    }

    _deleteTerrain(ids, options = {}) {
        TerrainDocument.deleteDocuments(ids, { parent: canvas.scene });
    }

    //refresh all the terrain on this layer
    refresh(icons) {
        for (let terrain of this.placeables) {
            terrain.refresh(icons);
        }
    }

    //refresh all the terrain on this layer
    redraw() {
        for (let terrain of this.placeables) {
            terrain.draw();
        }
    }
}