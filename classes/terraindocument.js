import * as fields from "../../../common/data/fields.mjs";
import { Document, DocumentData } from "../../../common/abstract/module.mjs";
import { makeid, log, error, i18n, setting, getflag } from '../terrain-main.js';
import { Terrain } from './terrain.js';

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

export class BaseTerrain extends Document {

    /** @inheritdoc */
    static get schema() {
        return TerrainData;
    }

    /** @inheritdoc */
    static get metadata() {
        return mergeObject(super.metadata, {
            name: "Terrain",
            collection: "terrain",
            label: "EnhancedTerrainLayer.terrain",
            isEmbedded: true,
            permissions: {
                create: "TEMPLATE_CREATE",
                update: this._canModify,
                delete: this._canModify
            }
        });
    };

    /**
     * Is a user able to update or delete an existing Drawing document??
     * @protected
     */
    static _canModify(user, doc, data) {
        if (user.isGM) return true;                     // GM users can do anything
        return doc.data.author === user.id;               // Users may only update their own created drawings
    }
}

export class TerrainDocument extends CanvasDocumentMixin(BaseTerrain) {

    /* -------------------------------------------- */
    /*  Properties                                  */
/* -------------------------------------------- */

    get layer() {
        return canvas.terrain;
    }

    get isEmbedded() {
        return true;
    }

    /**
     * A reference to the User who created the Drawing document.
     * @type {User}
     */
    get author() {
        return game.users.get(this.data.author);
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
        /*
        const created = await this.database.create(this.implementation, { data, options, parent, pack });
        await this._onCreateDocuments(created, context);
        return created;*/

        let originals = [];
        let created = [];
        for (let terrain of data) {
            //update this object
           // mergeObject(terrainDoc.data, data);
            terrain._id = terrain._id || makeid();

            //don't create a terrain that has less than 3 points
            if (terrain.points.length < 3)
                continue;

            if(terrain.update)
                terrain.update(terrain);

            if (terrain.document == undefined) {
                let document = new TerrainDocument(terrain, { parent: canvas.scene });
                terrain = document.data;
            }

            //update the data and save it to the scene
            if (game.user.isGM) {
                let key = `flags.enhanced-terrain-layer.terrain${terrain._id}`;
                await canvas.scene.update({ [key]: terrain.toJSON() }, { diff: false });

                originals.push(terrain);
            }

            //add it to the terrain set
            canvas.scene.data.terrain.set(terrain._id, terrain.document);

            //if the multiple has changed then update the image
            if (terrain.document._object != undefined)
                terrain.document.object.draw();
            else {
                terrain.document._object = new Terrain(terrain.document);
                canvas.terrain.objects.addChild(terrain.document._object);
                terrain.document._object.draw();
            }

            created.push(terrain);
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
            let terrain = canvas.scene.data.terrain.get(update._id);

            if (game.user.isGM) {
                originals.push(terrain.toObject());
            }
            //update this object
            //mergeObject(this.data, data);
            let changes = terrain.data.update(update, { diff: (options.diff !== undefined ? options.diff : true)});

            if (Object.keys(changes).length) {
                //update the data and save it to the scene
                if (game.user.isGM) {
                    let objectdata = duplicate(getflag(canvas.scene, `terrain${terrain.id}`));
                    mergeObject(objectdata, changes);
                    let key = `flags.enhanced-terrain-layer.terrain${terrain.id}`;
                    await canvas.scene.update({ [key]: objectdata }, { diff: false });
                }

                //if (data.environment != undefined)
                //    this.updateEnvironment();

                //if the multiple has changed then update the image
                if (changes.multiple != undefined || changes.environment != undefined) {
                    terrain.object.draw();
                } else
                    terrain.object.refresh();

                updated.push(terrain);
            }
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
        const deleteIds = options.deleteAll ? canvas.scene.data.terrain.keys() : ids;
        for (let id of deleteIds) {
            let terrain = canvas.scene.data.terrain.find(t => t.id == id);

            if (terrain == undefined)
                continue;

            //remove this object from the terrain list
            canvas.scene.data.terrain.delete(id);

            if (game.user.isGM) {
                let key = `flags.enhanced-terrain-layer.-=terrain${id}`;
                updates[key] = null;

                if (!options.isUndo)
                    originals.push(terrain.data);
            }

            //remove the PIXI object
            canvas.terrain.objects.removeChild(terrain.object);
            delete canvas.terrain._controlled[id];
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
}
