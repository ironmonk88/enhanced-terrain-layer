import { makeid, log, error, i18n, setting, getflag } from '../terrain-main.js';
import { Terrain } from './terrain.js';

/*
export class TerrainData extends DocumentData {
    static defineSchema() {
        return {
            _id: fields.DOCUMENT_ID,
            x: fields.NUMERIC_FIELD,
            y: fields.NUMERIC_FIELD,
            width: fields.NUMERIC_FIELD,
            height: fields.NUMERIC_FIELD,
            locked: fields.BOOLEAN_FIELD,
            hidden: fields.BOOLEAN_FIELD,
            points: fields.OBJECT_FIELD,
            multiple: fields.NUMERIC_FIELD,
            elevation: fields.NUMERIC_FIELD,
            depth: fields.NUMERIC_FIELD,
            opacity: fields.NUMERIC_FIELD,
            drawcolor: fields.STRING_FIELD,
            environment: fields.STRING_FIELD,
            obstacle: fields.STRING_FIELD,
            flags: fields.OBJECT_FIELD
        }
    }
}
*/

export class BaseTerrain extends foundry.abstract.Document {
    /** @inheritdoc */
    static metadata = Object.freeze(mergeObject(super.metadata, {
        name: "Terrain",
        collection: "terrain",
        label: "EnhancedTerrainLayer.terrain",
        isEmbedded: true,
        permissions: {
            create: "TEMPLATE_CREATE",
            update: this.#canModify,
            delete: this.#canModify
        }
    }, { inplace: false }));

    static defineSchema() {
        return {
            _id: new foundry.data.fields.DocumentIdField(),
            //author: new foundry.data.fields.ForeignDocumentField(BaseUser, { nullable: false, initial: () => game.user?.id }),
            shape: new foundry.data.fields.EmbeddedDataField(foundry.data.ShapeData),
            x: new foundry.data.fields.NumberField({ required: true, nullable: false, initial: 0, label: "XCoord" }),
            y: new foundry.data.fields.NumberField({ required: true, nullable: false, initial: 0, label: "YCoord" }),
            hidden: new foundry.data.fields.BooleanField(),
            locked: new foundry.data.fields.BooleanField(),
            multiple: new foundry.data.fields.NumberField({ required: true, nullable: false, initial: 2, label: "EnhancedTerrainLayer.Multiple" }),
            elevation: new foundry.data.fields.NumberField({ required: true, nullable: false, initial: 0, label: "EnhancedTerrainLayer.Elevation" }),
            depth: new foundry.data.fields.NumberField({ required: true, nullable: false, initial: 0,label: "EnhancedTerrainLayer.Depth" }),
            opacity: new foundry.data.fields.AlphaField({ required: true, nullable: false, initial: 1, label: "EnhancedTerrainLayer.Opacity" }),
            drawcolor: new foundry.data.fields.ColorField({ label: "EnhancedTerrainLayer.DrawColor" }),
            environment: new foundry.data.fields.StringField({ label: "EnhancedTerrainLayer.Environment" }),
            obstacle: new foundry.data.fields.StringField({ label: "EnhancedTerrainLayer.Obstacle" }),
            flags: new foundry.data.fields.ObjectField()
        }
    }

    _validateModel(data) {
        // Must have at least three points in the shape
        // (!(hasText || hasFill || hasLine)) {
        //  throw new Error("Drawings must have visible text, a visible fill, or a visible line");
        //
    }

    /**
     * Is a user able to update or delete an existing Drawing document??
     * @protected
     */
    static #canModify(user, doc, data) {
        if (user.isGM) return true;                     // GM users can do anything
        return false;
    }

    testUserPermission(user, permission, { exact = false } = {}) {
        return user.isGM;
    }

    static migrateData(data) {
        /**
         * V10 migration to ShapeData model
         * @deprecated since v10
        */
        if (getProperty(data, "shape.type") == undefined)
            setProperty(data, "shape.type", "p");
        this._addDataFieldMigration(data, "width", "shape.width");
        this._addDataFieldMigration(data, "height", "shape.height");
        this._addDataFieldMigration(data, "points", "shape.points", d => d.points.flat());
        return super.migrateData(data);
    }

    static shimData(data, options) {
        this._addDataFieldShim(data, "width", "shape.width", { since: 10, until: 12 });
        this._addDataFieldShim(data, "height", "shape.height", { since: 10, until: 12 });
        this._addDataFieldShim(data, "points", "shape.points", { since: 10, until: 12 });
        return super.shimData(data, options);
    }
}

export class TerrainDocument extends CanvasDocumentMixin(BaseTerrain) {

    /* -------------------------------------------- */
    /*  Properties                                  */
    /* -------------------------------------------- */
    #envobj = null;

    get layer() {
        return canvas.terrain;
    }

    get isEmbedded() {
        return true;
    }

    get fillType() {
        return CONST.DRAWING_FILL_TYPES.PATTERN;
    }

    get color() {
        return this.drawcolor || setting('environment-color')[this.environment] || getflag(canvas.scene, 'defaultcolor') || setting('environment-color')['_default'] || "#FFFFFF";
    }

    get alpha() {
        return this.opacity ?? getflag(canvas.scene, 'opacity') ?? setting('opacity') ?? 1;
    }

    get rotation() {
        return 0;
    }

    get bezierFactor() {
        return 0;
    }

    get strokeWidth() {
        return canvas.dimensions.size / 20;
    }

    static text(val) {
        return String.fromCharCode(215) + (val == 0.5 ? String.fromCharCode(189) : val);
    }

    get text() {
        let mult = Math.clamped(this.multiple, setting('minimum-cost'), setting('maximum-cost'));
        return this.constructor.text(mult);
    }

    get texture() {
        let image = setting('terrain-image');

        if (image == "clear")
            return null;

        let mult = Math.clamped(this.multiple, setting('minimum-cost'), setting('maximum-cost'));
        if (mult > 4)
            mult = 4;
        if (mult >= 1)
            mult = parseInt(mult);
        if (mult < 1)
            mult = 0.5;

        if (mult == 1)
            return null;

        return `modules/enhanced-terrain-layer/img/${image}${mult}x.svg`;
    }

    get environmentObject() {
        if (this.#envobj?.id == this.environment)
            return this.#envobj;
        this.#envobj = canvas.terrain.getEnvironments().find(e => e.id == this.environment);
        return this.#envobj;
    }

    get width() {
        return this.shape.width;
    }

    get height() {
        return this.shape.height;
    }

    get top() {
        return this.elevation + this.depth;
    }

    get bottom() {
        return this.elevation;
    }

    /* -------------------------------------------- */

    /**
     * A flag for whether the current User has full ownership over the Drawing document.
     * @type {boolean}
     */
    get isOwner() {
        return game.user.isGM || (this.data.author === game.user.id);
    }

    static async createDocuments(data = [], context = {}) {
        const { parent, pack, ...options } = context;

        let originals = [];
        let created = [];
        for (let terrain of data) {
            if (terrain instanceof TerrainDocument)
                terrain = terrain.toObject();
            //update this object
           // mergeObject(terrainDoc.data, data);
            terrain._id = terrain._id || makeid();

            //don't create a terrain that has less than 3 points
            if ((terrain.shape.type == CONST.DRAWING_TYPES.POLYGON || terrain.shape.type == CONST.DRAWING_TYPES.FREEHAND) && terrain.shape.points.length < 3)
                continue;

            let document = new TerrainDocument(terrain, context);

            /*
            if (terrain.update)
                terrain.update(terrain);

            if (terrain.document == undefined) {
                let document = new TerrainDocument(terrain, { parent: canvas.scene });
                terrain.document = document;
            }
            */

            //update the data and save it to the scene
            if (game.user.isGM) {
                let key = `flags.enhanced-terrain-layer.terrain${document._id}`;
                await canvas.scene.update({ [key]: document.toObject() }, { diff: false });

                originals.push(terrain);
            }

            //add it to the terrain set
            canvas["#scene"].terrain.set(document._id, document);

            //if the multiple has changed then update the image
            if (document._object != undefined)
                document.object.draw();
            else {
                document.object?._onCreate(terrain, options, game.user.id);
                //document.object.draw();
            }

            created.push(document);
        }

        if(originals.length)
            canvas.terrain.storeHistory("create", originals);

        if (game.user.isGM)
            game.socket.emit('module.enhanced-terrain-layer', { action: '_createTerrain', arguments: [created] });

        await this._onCreateDocuments(created, context);
        return created;
    }

    static async updateDocuments(updates = [], context = {}) {
        const { parent, pack, ...options } = context;
        /*
        const updated = await this.database.update(this.implementation, { updates, options, parent, pack });
        await this._onUpdateDocuments(updated, context);
        return updated;*/

        let originals = [];
        let updated = [];
        for (let update of updates) {
            let document = canvas["#scene"].terrain.get(update._id);

            if (game.user.isGM) {
                originals.push(document.toObject(false));
            }

            delete update.submit;
            //update this object
            //mergeObject(this.data, data);
            //let changes = await terrain.update(update, { diff: (options.diff !== undefined ? options.diff : true)});
            let changes = foundry.utils.diffObject(document.toObject(false), update, { deletionKeys: true });
            if (foundry.utils.isEmpty(changes)) continue;

            if (document.object._original) {
                mergeObject(document.object._original, changes);
            } else
                document.alter(changes);

            //update the data and save it to the scene
            if (game.user.isGM) {
                let objectdata = duplicate(getflag(document.parent, `terrain${document.id}`));
                mergeObject(objectdata, changes);
                let key = `flags.enhanced-terrain-layer.terrain${document.id}`;
                await document.parent.update({ [key]: objectdata }, { diff: false });

                //document.updateSource(changes);
            }

            //if (changes.environment != undefined)
            //    this.updateEnvironment();

            //if the multiple has changed then update the image
            if (changes.multiple != undefined || changes.environment != undefined) {
                document.object.draw();
            } else
                document.object.refresh();

            updated.push(document);
        }

        if (originals.length && !options.isUndo)
            canvas.terrain.storeHistory("update", originals);

        if (game.user.isGM)
            game.socket.emit('module.enhanced-terrain-layer', { action: '_updateTerrain', arguments: [updated] });

        await this._onUpdateDocuments(updated, context);
        return updated;
    }

    static async deleteDocuments(ids = [], context = {}) {
        const { parent, pack, ...options } = context;

        let updates = [];
        let originals = [];
        let deleted = [];
        const deleteIds = options.deleteAll ? canvas["#scene"].terrain.keys() : ids;
        for (let id of deleteIds) {
            let terrain = canvas["#scene"].terrain.find(t => t.id == id);

            if (terrain == undefined)
                continue;

            //remove this object from the terrain list
            canvas["#scene"].terrain.delete(id);

            if (game.user.isGM) {
                let key = `flags.enhanced-terrain-layer.-=terrain${id}`;
                updates[key] = null;

                if (!options.isUndo)
                    originals.push(terrain);
            }

            //remove the PIXI object
            canvas.primary.removeTerrain(terrain);
            //canvas.terrain.objects.removeChild(terrain.object);
            delete canvas.terrain.controlled[id];
            terrain.object.destroy({ children: true });

            deleted.push(terrain);
        }

        if (!options.isUndo && originals.length)
            canvas.terrain.storeHistory("delete", originals);

        if (game.user.isGM)
            game.socket.emit('module.enhanced-terrain-layer', { action: '_deleteTerrain', arguments: [ids] });

        //remove the deleted items from the scene
        if(Object.keys(updates).length)
            canvas.scene.update(updates);

        await this._onDeleteDocuments(deleted, context);
        return deleted;
    }

    //static async create(data, options) {

        /*
        data._id = data._id || makeid();

        let userId = game.user._id;

        data = data instanceof Array ? data : [data];
        for (let d of data) {
            const allowed = Hooks.call(`preCreateTerrain`, this, d, options, userId);
            if (allowed === false) {
                debug(`Terrain creation prevented by preCreate hook`);
                return null;
            }
        }

        let embedded = data.map(d => {
            let object = canvas.terrain.createObject(d);
            object._onCreate(options, userId);
            canvas["#scene"].terrain.push(d);
            canvas.scene.setFlag('enhanced-terrain-layer', 'terrain' + d._id, d);
            Hooks.callAll(`createTerrain`, canvas.terrain, d, options, userId);
            return d;
        });

        return data.length === 1 ? embedded[0] : embedded;
        */
    //}

    //async update(data = {}, context = {}) {
        //update this object
        /*
        mergeObject(this, data);
        if (options.save === true) {
            //update the data and save it to the scene
            let objectdata = duplicate(getflag(canvas.scene, `terrain${this.id}`));
            mergeObject(objectdata, this.document.toObject());
            //let updates = {};
            //updates['flags.enhanced-terrain-layer.terrain' + this.document._id + '.multiple'] = data.multiple;
            let key = `flags.enhanced-terrain-layer.terrain${this.document._id}`;
            await canvas.scene.update({ [key]: objectdata }, { diff: false });
            //canvas.terrain._costGrid = null;
        }

        if (data.environment != undefined)
            this.updateEnvironment();
        //await canvas.scene.setFlag("enhanced-terrain-layer", "terrain" + this.document._id, objectdata, {diff: false});
        //if the multiple has changed then update the image
        if (data.multiple != undefined || data.environment != undefined) {
            this.object.draw();
        } else
            this.object.refresh();
        return this;
        */
    //}

    async delete(options) {
        let key = `flags.enhanced-terrain-layer.-=terrain${this.document._id}`;
        await canvas.scene.update({ [key]: null }, { diff: false });
        return this;
    }

    alter(changes) {
        // 'cause I havn't found an easy way to mass update a document.  Pretty sure Foundry does it somewhere.... but until I find it.
        for (let [k, v] of Object.entries(changes)) {
            if (k == "shape") {
                for (let [s_k, s_v] of Object.entries(v)) {
                    this.shape[s_k] = s_v;
                }
            } else
                this[k] = v;
        }
        mergeObject(this._source, changes);
    }

    //updateEnvironment() {
        //this.environment = canvas.terrain.getEnvironments().find(e => e.id == this.environment);
        //if (this.environment == undefined && !setting('use-obstacles'))
        //    this.environment = canvas.terrain.getObstacles().find(e => e.id == this.document.environment);
    //}
}
