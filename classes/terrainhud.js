import { TerrainLayer } from './terrainlayer.js';

export class TerrainHUD extends BasePlaceableHUD {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "terrain-hud",
            template: "modules/enhanced-terrain-layer/templates/terrain-hud.html"
        });
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();
        return mergeObject(data, {
            lockedClass: data.locked ? "active" : "",
            visibilityClass: data.hidden ? "active" : "",
            cost: TerrainLayer.multipleText(this.object.multiple),
            terraintype: this.object.terraintype,
            environment: this.object.environment
        });
    }

    activateListeners(html) {
        super.activateListeners(html);

        $('.inc-multiple', this.element).on("click", this._onHandleClick.bind(this, true));
        $('.dec-multiple', this.element).on("click", this._onHandleClick.bind(this, false));
        /*
        this.frame.handle.off("mouseover").off("mouseout").off("mousedown")
            .on("mouseover", this._onHandleHoverIn.bind(this))
            .on("mouseout", this._onHandleHoverOut.bind(this))
            .on("mousedown", this._onHandleMouseDown.bind(this));
        this.frame.handle.interactive = true;*/
    }

    /*
     * async _onToggleVisibility(event) {
    event.preventDefault();

    // Toggle the visible state
    const isHidden = this.object.data.hidden;
    const updates = this.layer.controlled.map(o => {
      return {_id: o.id, hidden: !isHidden};
    });

    // Update all objects
    await this.layer.updateMany(updates);
    event.currentTarget.classList.toggle("active", !isHidden);
  }
  */

    _onHandleClick(increase, event) {
        const updates = this.layer.controlled.map(o => {
            let mult = o.data.multiple;
            let idx = TerrainLayer.multipleOptions.indexOf(mult);
            idx = Math.clamped((increase ? idx + 1 : idx - 1), 0, TerrainLayer.multipleOptions.length - 1);
            return { _id: o.id, multiple: TerrainLayer.multipleOptions[idx] };
        });

        this.layer.updateMany(updates).then(() => {
            for (let terrain of this.layer.controlled) {
                let data = updates.find(u => { return u._id == terrain.data._id });
                terrain.update(data, { save: false }).then(() => {
                    $('.terrain-cost', this.element).html(String.fromCharCode(215) + this.object.multiple);
                });
            }
        });

        /*
        let mult = this.object.data.multiple;
        let idx = TerrainLayer.multipleOptions.indexOf(mult);
        idx = Math.clamped((increase ? idx + 1 : idx - 1), 0, TerrainLayer.multipleOptions.length - 1);
        this.object.update({ multiple: TerrainLayer.multipleOptions[idx] });
        this.object.refresh();*/
    }

    async _onToggleVisibility(event) {
        event.preventDefault();

        // Toggle the visible state
        const isHidden = this.object.data.hidden;
        const updates = this.layer.controlled.map(o => {
            return { _id: o.id, hidden: !isHidden };
        });

        // Update all objects
        await this.layer.updateMany(updates).then(() => {
            for (let terrain of this.layer.controlled) {
                let data = updates.find(u => { return u._id == terrain.data._id });
                terrain.update(data, { save: false });
            }
        });
        event.currentTarget.classList.toggle("active", !isHidden);
    }

    async _onToggleLocked(event) {
        event.preventDefault();

        // Toggle the locked state
        const isLocked = this.object.data.locked;
        const updates = this.layer.controlled.map(o => {
            return { _id: o.id, locked: !isLocked };
        });

        // Update all objects
        await this.layer.updateMany(updates).then(() => {
            for (let terrain of this.layer.controlled) {
                let data = updates.find(u => { return u._id == terrain.data._id });
                terrain.update(data, { save: false });
            }
        });
        event.currentTarget.classList.toggle("active", !isLocked);
    }

    /* -------------------------------------------- */

    /** @override */
    setPosition() {
        $('#hud').append(this.element);
        let { x, y, width, height } = this.object.terrain.hitArea;
        const c = 70;
        const p = 0;
        const position = {
            width: width + (c * 2), // + (p * 2),
            height: height + (p * 2),
            left: x + this.object.data.x - c - p,
            top: y + this.object.data.y - p
        };
        this.element.css(position);
    }
}