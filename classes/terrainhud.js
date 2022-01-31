import { TerrainLayer } from './terrainlayer.js';
import { log, setting, i18n } from '../terrain-main.js';

export class TerrainHUD extends BasePlaceableHUD {
    _showEnvironments = false;

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "terrain-hud",
            template: "modules/enhanced-terrain-layer/templates/terrain-hud.html"
        });
    }

    bind(object) {
        this._showEnvironments = false;
        return super.bind(object);
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        var _environments = canvas.terrain.getEnvironments().map(obj => {
            obj.text = i18n(obj.text);
            obj.active = (this.object.data.environment == obj.id);

            return obj;
        });

        /*
        var _obstacles = canvas.terrain.getObstacles().map(obj => {
            obj.text = i18n(obj.text);
            obj.active = (setting('use-obstacles') ? this.object.data.obstacle == obj.id : (this.object.data.environment || this.object.data.obstacle) == obj.id);
            return obj;
        });*/

        const data = super.getData();
        return mergeObject(data, {
            lockedClass: data.locked ? "active" : "",
            visibilityClass: data.hidden ? "active" : "",
            cost: TerrainLayer.multipleText(this.object.multiple),
            elevation: this.object.elevation,
            depth: this.object.depth,
            environment: this.object.environment,
            environments: _environments
        });
    }

    activateListeners(html) {
        super.activateListeners(html);

        $('.inc-multiple', this.element).on("click", this._onHandleClick.bind(this, true));
        $('.dec-multiple', this.element).on("click", this._onHandleClick.bind(this, false));
        html.find(".environments > img").click(this._onClickEnvironments.bind(this));

        html.find(".environment-list")
            .on("click", ".environment-container", this._onToggleEnvironment.bind(this))
            .on("contextmenu", ".environment-container", event => this._onToggleEnvironment(event));

        /*
        this.frame.handle.off("mouseover").off("mouseout").off("mousedown")
            .on("mouseover", this._onHandleHoverIn.bind(this))
            .on("mouseout", this._onHandleHoverOut.bind(this))
            .on("mousedown", this._onHandleMouseDown.bind(this));
        this.frame.handle.interactive = true;*/
    }

    _onClickEnvironments(event) {
        event.preventDefault();
        this._toggleEnvironments(!this._showEnvironments);
    }

    /* -------------------------------------------- */

    _toggleEnvironments(active) {
        this._showEnvironments = active;
        const button = this.element.find(".control-icon.environments")[0];
        button.classList.toggle("active", active);
        const palette = button.querySelector(".environment-list");
        palette.classList.toggle("active", active);
    }

    /* -------------------------------------------- */

    _onToggleEnvironment(event) {
        event.preventDefault();
        let ctrl = event.currentTarget;
        let id = ctrl.dataset.environmentId;
        $('.environment-list .environment-container.active', this.element).removeClass('active');
        if (id != this.object.data.environment)
            $('.environment-list .environment-container[data-environment-id="' + id + '"]', this.element).addClass('active');

        const updates = this.layer.controlled.map(o => {
            return { _id: o.id, environment: (id != this.object.data.environment ? id : '') };
        });

        return canvas.scene.updateEmbeddedDocuments("Terrain", updates).then(() => {
            for (let terrain of this.layer.controlled) {
                let data = updates.find(u => { return u._id == terrain.data._id });
                terrain.update(data, { save: false }).then(() => {
                    $('.environments > img', this.element).attr('src', terrain?.environment?.icon || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=');
                });
            }
        });
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
            let mult = TerrainLayer.alterMultiple(o.data.multiple, increase);
            //let idx = TerrainLayer.multipleOptions.indexOf(mult);
            //idx = Math.clamped((increase ? idx + 1 : idx - 1), 0, TerrainLayer.multipleOptions.length - 1);
            return { _id: o.id, multiple: mult }; //TerrainLayer.multipleOptions[idx] };
        });

        let that = this;
        return canvas.scene.updateEmbeddedDocuments("Terrain", updates).then(() => {
            $('.terrain-cost', that.element).html(`${TerrainLayer.multipleText(that.object.multiple)}`);
        });

        /*
        this.layer.updateMany(updates).then(() => {
            for (let terrain of this.layer.controlled) {
                let data = updates.find(u => { return u._id == terrain.data._id });
                terrain.update(data, { save: false }).then(() => {
                    $('.terrain-cost', this.element).html(String.fromCharCode(215) + this.object.multiple);
                });
            }
        });*/

        /*
        let mult = this.object.data.multiple;
        let idx = TerrainLayer.multipleOptions.indexOf(mult);
        idx = Math.clamped((increase ? idx + 1 : idx - 1), 0, TerrainLayer.multipleOptions.length - 1);
        this.object.update({ multiple: TerrainLayer.multipleOptions[idx] });
        this.object.refresh();*/
    }

    async _onToggleVisibility(event) {
        event.preventDefault();

        const isHidden = this.object.data.hidden;

        event.currentTarget.classList.toggle("active", !isHidden);

        // Toggle the visible state
        const updates = this.layer.controlled.map(o => { return { _id: o.id, hidden: !isHidden }; });
        return canvas.scene.updateEmbeddedDocuments("Terrain", updates);
    }

    async _onToggleLocked(event) {
        event.preventDefault();

        const isLocked = this.object.data.locked;

        event.currentTarget.classList.toggle("active", !isLocked);

        // Toggle the locked state
        const updates = this.layer.controlled.map(o => { return { _id: o.id, locked: !isLocked }; });
        return canvas.scene.updateEmbeddedDocuments("Terrain", updates);
        
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