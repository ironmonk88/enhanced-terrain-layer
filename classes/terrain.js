import { makeid, log, setting, debug, getflag } from '../terrain-main.js';
import { TerrainLayer } from './terrainlayer.js';
import { TerrainShape } from './terrainshape.js';

export class Terrain extends PlaceableObject {

    /**
   * The border frame and resizing handles for the drawing.
   * @type {PIXI.Container}
   */
    frame;

    /**
   * The overlay for the icon and text.
   * @type {PIXI.Container}
   */
    overlay;

    /**
     * A text label that may be displayed as part of the interface layer for the Drawing.
     * @type {PreciseText|null}
     */
    text = null;

    /**
   * The icon to display the environment.
   * @type {PIXI.Container}
   */
    container;

    /**
   * The icon to display the environment.
   * @type {PIXI.Container}
   */
    icon;

    /**
     * The drawing shape which is rendered as a PIXI.Graphics subclass in the PrimaryCanvasGroup.
     * @type {DrawingShape}
     */
    shape;

    /**
     * An internal timestamp for the previous freehand draw time, to limit sampling.
     * @type {number}
     * @private
     */
    _drawTime = 0;

    /**
     * An internal flag for the permanent points of the polygon.
     * @type {number[]}
     * @private
     */
    _fixedPoints = foundry.utils.deepClone(this.document.shape.points);

    /* -------------------------------------------- */

    /** @inheritdoc */
    static embeddedName = "Terrain";

    /* -------------------------------------------- */

    /**
     * The rate at which points are sampled (in milliseconds) during a freehand drawing workflow
     * @type {number}
     */
    static FREEHAND_SAMPLE_RATE = 75;

    /**
     * A convenience reference to the possible shape types.
     * @enum {string}
     */
    static SHAPE_TYPES = foundry.data.ShapeData.TYPES;

    /* -------------------------------------------- */
    /*  Properties                                  */
    /* -------------------------------------------- */

    /** @override */
    get bounds() {
        const { x, y, shape } = this.document;
        return new PIXI.Rectangle(x, y, shape.width, shape.height).normalize();
    }

    /* -------------------------------------------- */

    /** @override */
    get center() {
        const { x, y, shape } = this.document;
        if (this.isPolygon)
            return this.centerPolygon;
        else
            return new PIXI.Point(x + (shape.width / 2), y + (shape.height / 2));
    }

    get centerPolygon() {
        const { x, y, shape } = this.document;
        //center overlay
        var points = shape.points;
        var tx = 0,
            ty = 0,
            i,
            j,
            f;

        let s = canvas.dimensions.size;

        var area = function (points) {
            var area = 0,
                i,
                j;

            for (i = 0, j = points.length - 2; i < points.length - 1; j = i, i += 2) {
                var point1 = { x: points[i], y: points[i + 1] };
                var point2 = { x: points[j], y: points[j + 1] };
                area += point1.x * point2.y;
                area -= point1.y * point2.x;
            }
            area /= 2;

            return area;
        }

        for (i = 0, j = points.length - 2; i < points.length - 1; j = i, i += 2) {
            var point1 = { x: points[i], y: points[i + 1] };
            var point2 = { x: points[j], y: points[j + 1] };
            f = point1.x * point2.y - point2.x * point1.y;
            tx += (point1.x + point2.x) * f;
            ty += (point1.y + point2.y) * f;
        }

        f = area(points) * 6;

        return new PIXI.Point(x + parseInt(tx / f), y + parseInt(ty / f));
        //this.overlay.anchor.set(0.5, 0.5);
        //this.overlay.x = parseInt(x / f);
        //this.overlay.y = parseInt(y / f);// - (s / 5.2);
    }

    /* -------------------------------------------- */

    /**
     * A Boolean flag for whether the Drawing utilizes a tiled texture background?
     * @type {boolean}
     */
    get isTiled() {
        return true;
    }

    /* -------------------------------------------- */

    /**
     * A Boolean flag for whether the Drawing is a Polygon type (either linear or freehand)?
     * @type {boolean}
     */
    get isPolygon() {
        return this.type === Drawing.SHAPE_TYPES.POLYGON;
    }

    /* -------------------------------------------- */

    /**
     * Does the Drawing have text that is displayed?
     * @type {boolean}
     */
    get hasText() {
        return this.true;
    }

    /* -------------------------------------------- */

    /**
     * The shape type that this Drawing represents. A value in Drawing.SHAPE_TYPES.
     * @see {@link Drawing.SHAPE_TYPES}
     * @type {string}
     */
    get type() {
        return this.document.shape.type;
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    _destroy(options) {
        canvas.primary.removeTerrain(this);
        this.texture?.destroy();
    }

    /** @override */
    async _draw() {

        // Load the background texture, if one is defined
        const texture = this.document.texture;
        if (this.isPreview) this.texture = this._original.texture?.clone();
        else this.texture = texture ? await loadTexture(texture, { fallback: "icons/svg/hazard.svg" }) : null;

        //this.document.updateEnvironment();

        // Create the primary group drawing container
        //this.container = canvas.primary.addTerrain(this); //this.addChild(this.#drawTerrain());
        //this.container.removeChildren();

        this.shape = canvas.primary.addTerrain(this);//this.container.addChild(this.#drawTerrain());

        // Control Border
        this.frame = this.addChild(this.#drawFrame());

        //this.overlay = this.addChild(new PIXI.Graphics());
        //this.overlay.anchor.set(0.5, 0.5);

        // Terrain text
        this.text = this.addChild(this.#drawText());

        // Terrain icon
        this.icon = this.addChild(this.#drawIcon());

        // Enable Interactivity, if this is a true Terrain
        //if (this.id) this.activateListeners();
        return this;
    }

    #drawTerrain() {
        let shape = new TerrainShape(this);
        shape.texture = this.texture ?? null;
        shape.object = this;
        return shape;
    }

    /* -------------------------------------------- */

    /**
     * Create elements for the Terrain border and handles
     * @private
     */
    #drawFrame() {
        const frame = new PIXI.Container();
        frame.border = frame.addChild(new PIXI.Graphics());
        frame.handle = frame.addChild(new ResizeHandle([1, 1]));
        return frame;
    }

    /**
     * Create elements for the foreground text
     * @private
     */
    #drawText() {
        const { text, shape } = this.document;

        let s = canvas.dimensions.size;
        let fontSize = (s / 3);

        const stroke = Math.max(Math.round(fontSize / 32), 2);

        // Define the text style
        const textStyle = PreciseText.getTextStyle({
            fontFamily: 'Arial',
            fontSize: fontSize,
            fill: "#FFFFFF",
            stroke: "#111111",
            strokeThickness: stroke,
            dropShadow: true,
            dropShadowColor: "#000000",
            dropShadowBlur: Math.max(Math.round(fontSize / 16), 2),
            dropShadowAngle: 0,
            dropShadowDistance: 0,
            align: "center",
            wordWrap: false,
            wordWrapWidth: shape.width,
            padding: stroke
        });

        return new PreciseText(text || undefined, textStyle);
    }

    #drawIcon() {
        const { environmentObject, color } = this.document;

        let icon = new PIXI.Container();

        if (environmentObject?.icon == undefined)
            return icon;

        let s = canvas.dimensions.size;
        const size = Math.max(Math.round(s / 2.5), 5);

        let sc = Color.from(color);

        icon.border = icon.addChild(new PIXI.Graphics());
        icon.border.clear().lineStyle(3, 0x000000).drawRoundedRect(0, 0, size, size, 4).beginFill(0x000000, 0.5).lineStyle(2, sc).drawRoundedRect(0, 0, size, size, 4).endFill();

        icon.background = icon.addChild(new PIXI.Sprite.from(environmentObject?.icon));
        icon.background.x = icon.background.y = 1;
        icon.background.width = icon.background.height = size - 2;

        return icon;
    }

    _refresh() {
        // Refresh the shape bounds and the displayed frame
        const { x, y, hidden, shape } = this.document;

        // Refresh the primary drawing container
        if (this.shape)
            this.shape.refresh();
        //this.shape.position.set(shape.width / 2, shape.height / 2);

        const bounds = new PIXI.Rectangle(0, 0, shape.width, shape.height).normalize();
        this.hitArea = this.controlled ? bounds.clone().pad(50) : this.shape._pixishape; // Pad to include resize handle
        this.buttonMode = true;
        if (this.id && this.controlled) this.#refreshFrame(bounds);
        else this.frame.visible = false;

        //const center = this.center;
        //this.overlay.visible = this.id && !this._original;
        //this.overlay.alpha = opacity;
        //this.overlay.position.set(center.x - x, center.y - y);

        // Refresh the display of text
        this.#refreshText();
        this.#refreshIcon();

        // Set position and visibility
        this.position.set(x, y);
        this.visible = this.isVisible;
    }

    #refreshFrame(rect) {
        const { x, y, alpha } = this.document;

        // Determine the border color
        const colors = CONFIG.Canvas.dispositionColors;
        let bc = colors.INACTIVE;
        if (this.controlled) {
            bc = this.document.locked ? colors.HOSTILE : colors.CONTROLLED;
        }

        // Draw the border
        const pad = 6;
        const t = CONFIG.Canvas.objectBorderThickness;
        const h = Math.round(t / 2);
        const o = Math.round(h / 2) + pad;
        const border = rect.clone().pad(o);
        this.frame.border.clear().lineStyle(t, 0x000000).drawShape(border).lineStyle(h, bc).drawShape(border);

        // Draw the handle
        this.frame.handle.refresh(border);
        this.frame.visible = true;
    }

    #refreshText() {

        if (!this.document.text) return;
        const { x, y, alpha } = this.document;
        this.text.alpha = (ui.controls.activeControl == 'terrain' ? 1.0 : alpha) ?? 1.0;
        this.text.visible = this.id && (setting('show-text') || ui.controls.activeControl == 'terrain');
        const padding = (this.document.environmentObject?.icon && (setting('show-icon') || ui.controls.activeControl == 'terrain') ? 0 : (this.text.width / 2));
        const center = this.center;
        this.text.position.set(
            (center.x - x) - padding,
            (center.y - y) - (this.text.height / 2)
        );
    }

    #refreshIcon() {

        if (!this.document.environmentObject?.icon) return;
        const { x, y, alpha } = this.document;
        this.icon.alpha = (ui.controls.activeControl == 'terrain' ? 1.0 : alpha) ?? 1.0;
        this.icon.visible = this.id && (setting('show-icon') || ui.controls.activeControl == 'terrain');
        const padding = (this.document.text && (setting('show-text') || ui.controls.activeControl == 'terrain') ? this.icon.width : (this.icon.width / 2));
        const center = this.center;
        this.icon.position.set(
            (center.x - x) - padding,
            (center.y - y) - (this.icon.height / 2)
        );
    }

    static get defaults() {
        const sceneFlags = canvas.scene.flags['enhanced-terrain-layer'];
        let sceneMult = sceneFlags?.multiple;
        let sceneElev = sceneFlags?.elevation;
        let sceneDepth = sceneFlags?.depth;
        let sceneEnv = sceneFlags?.environment;
        let sceneOpacity = sceneFlags?.opacity;
        return {
            //rotation:0,
            locked: false,
            hidden: false,
            //drawcolor: setting('environment-color')[sceneEnv] || getflag(canvas.scene, 'defaultcolor') || setting('environment-color')['_default'] || "#FFFFFF",
            opacity: (sceneOpacity == undefined || sceneOpacity == "" ? setting('opacity') ?? 1 : sceneOpacity),
            multiple: (sceneMult == undefined || sceneMult == "" ? this.layer.defaultmultiple : Math.clamped(parseInt(sceneMult), setting('minimum-cost'), setting('maximum-cost'))),
            elevation: (sceneElev == undefined || sceneElev == "" ? 0 : sceneElev),
            depth: (sceneDepth == undefined || sceneDepth == "" ? 0 : sceneDepth),
            environment: sceneEnv || null,
            obstacle: null,
            shape: {},
            bezierFactor: 0
        }
    }

    static get layer() {
        return canvas.terrain;
    }

    get isVisible() {
        const { x, y, shape, hidden } = this.document;

        if (ui.controls.activeControl == 'terrain')
            return true;

        if (hidden && (!game.user.isGM || setting("only-show-active")))
            return false;

        if (!this.layer.showterrain && !(this.layer.showOnDrag && this.layer._tokenDrag))
            return false;

        const point = this.center;
        const tolerance = canvas.grid.size;
        return canvas.effects.visibility.testVisibility(point, { tolerance, object: this });
    }

    /*
    get multiple() {
        return this.document.multiple ?? Terrain.defaults.multiple;
    }

    get elevation() {
        return this.document.elevation ?? Terrain.defaults.elevation;
    }

    get depth() {
        return this.document.depth ?? 0;
    }

    get top() {
        return this.elevation + this.depth;
    }

    get bottom() {
        return this.elevation;
    }

    get color() {
        return this.document.drawcolor || setting('environment-color')[this.environment?.id] || this.environment?.color || getflag(canvas.scene, 'defaultcolor') || setting('environment-color')['_default'] || "#FFFFFF";
    }

    get opacity() {
        return this.document.opacity ?? getflag(canvas.scene, 'opacity') ?? setting('opacity') ?? 1;
    }
    */

    /*
    get environment() {
        return this.document.environment;
    }*/

    /*
    get obstacle() {
        return this.document.obstacle;
    }
    */

    contains(x, y) {
        if (!(x < 0 || y < 0 || x > this.document.width || y > this.document.height)) {
            return this.shape?.contains(x, y);
        }
        return false;
    }

    cost() {
        if (this.document.hidden) {
            return 1;
        } else
            return this.document.multiple;
    }






















    /**
     * Create the components of the terrain element, the terrain container, the drawn shape, and the overlay text
     */
    /*
    _createTerrain() {

        // Terrain container
        this.terrain = this.addChild(new PIXI.Container());

        // Terrain Shape
        this.drawing = this.terrain.addChild(new PIXI.Graphics());

        // Overlay Text
        this.overlay = this.terrain.addChild(new PIXI.Graphics());
        this.text = this.overlay.addChild(this._createText());
        this._createIcon();
        this._positionOverlay();
    }
    */

    /* -------------------------------------------- */
    /*
    _createIcon() {
        if (this.icon && !this.icon._destroyed) {
            this.icon.destroy();
            this.icon = null;
        }

        if (this.environment?.icon == undefined)
            return;

        this.icon = this.overlay.addChild(new PIXI.Container());

        let s = canvas.dimensions.size;
        const size = Math.max(Math.round(s / 2.5), 5);

        let sc = colorStringToHex(this.color);

        this.icon.border = this.icon.addChild(new PIXI.Graphics());
        this.icon.border.clear().lineStyle(3, 0x000000).drawRoundedRect(0, 0, size, size, 4).beginFill(0x000000, 0.5).lineStyle(2, sc).drawRoundedRect(0, 0, size, size, 4).endFill();

        this.icon.background = this.icon.addChild(new PIXI.Sprite.from(this.environment?.icon));
        this.icon.background.x = this.icon.background.y = 1;
        this.icon.background.width = this.icon.background.height = size - 2;
    }
    */

    /*
    _refresh() {
        if (this._destroyed || this.drawing?._destroyed || this.drawing == undefined) return;

        this.drawing.clear();

        let s = canvas.dimensions.size;

        // Outer Stroke
        //const colors = CONFIG.Canvas.dispositionColors;
        let sc = Color.from(this.color); //this.document.hidden ? colorStringToHex("#C0C0C0") :
        let lStyle = new PIXI.LineStyle();
        mergeObject(lStyle, { width: s / 20, color: sc, alpha: (setting('draw-border') ? 1 : 0), cap: PIXI.LINE_CAP.ROUND, join: PIXI.LINE_JOIN.ROUND, visible: true });
        this.drawing.lineStyle(lStyle);

        let drawAlpha = (ui.controls.activeControl == 'terrain' ? 1.0 : this.opacity);

        // Fill Color or Texture
        if (this.texture && sc != 'transparent') {
            let sW = (canvas.dimensions.size / (this.texture.width * (setting('terrain-image') == 'diagonal' ? 2 : 1)));
            let sH = (canvas.dimensions.size / (this.texture.height * (setting('terrain-image') == 'diagonal' ? 2 : 1)));
            this.drawing.beginTextureFill({
                texture: this.texture,
                color: sc,
                alpha: drawAlpha,
                matrix: new PIXI.Matrix().scale(sW, sH)
            });
        }

        // Draw polygon
        let points = this.document.points || [];
        if (points.length >= 2) {
            if (points.length === 2) this.drawing.endFill();
            this.shape = new PIXI.Polygon(points.deepFlatten());
        }

        if (this.shape && sc != 'transparent') {
            if (this.document.hidden) {
                this.drawDashedPolygon.call(this.drawing, points, 0, 0, 0, 1, 5, 0);
                lStyle.width = 0;
                this.drawing.lineStyle(lStyle);
            }
            this.drawing.drawShape(this.shape);
        }

        // Conclude fills
        this.drawing.lineStyle(0x000000, 0.0).closePath();
        this.drawing.endFill();
        this.drawing.alpha = drawAlpha;

        let showicon = setting('show-icon') && this.icon && !this.icon._destroyed;

        this.text.visible = setting('show-text') && this.multiple != 1;
        this.text.x = (showicon ? -this.text.width - 2 : -(this.text.width / 2));
        this.text.y = -(this.text.height / 2);
        if (this.icon && !this.icon._destroyed) {
            this.icon.visible = setting('show-icon');
            this.icon.x = (setting('show-text') ? 2 : -(this.icon.width / 2));
            this.icon.y = -(this.icon.height / 2);
        }

        const size = Math.max(Math.round(s / 2.5), 5);
        //if(this.icon && icons)
        //    this.icon.border.lineStyle(3, 0x000000).drawRoundedRect(0, 0, size, size, 4).lineStyle(2, sc).drawRoundedRect(0, 0, size, size, 4);

        this.overlay.visible = this.id && !this._original;
        this.overlay.alpha = drawAlpha;

        // Determine drawing bounds and update the frame
        const bounds = this.terrain.getLocalBounds();
        if (this.id && this.controlled) this._refreshFrame(bounds);
        else this.frame.visible = false;

        // Toggle visibility
        this.position.set(this.document.x, this.document.y);
        this.terrain.hitArea = bounds;
        this.alpha = 1;
        this.visible = !this.document.hidden || (game.user.isGM && (ui.controls.activeControl == 'terrain' || !setting('only-show-active')));

        if (this.visible && game.modules.get("levels")?.active && canvas.tokens.controlled[0]) {
            const token = canvas.tokens.controlled[0];
            if (token.data.elevation > this.bottom || token.data.elevation < this.top)
                this.visible = false;
        }

        return this;
    }
    */

    /* -------------------------------------------- */



    /* -------------------------------------------- */

    /**
     * Add a new polygon point to the terrain, ensuring it differs from the last one
     * @private
     */
    _addPoint(position, { round = false, snap = false, temporary = false } = {}) {
        if (snap) position = canvas.grid.getSnappedPosition(position.x, position.y, this.layer.gridPrecision);
        else if (round) {
            position.x = Math.roundFast(position.x);
            position.y = Math.roundFast(position.y);
        }

        // Avoid adding duplicate points
        const last = this._fixedPoints.slice(-2);
        const next = [position.x - this.document.x, position.y - this.document.y];
        if (next.equals(last)) return;

        // Append the new point and update the shape
        const points = this._fixedPoints.concat(next);
        this.document.shape.updateSource({ points });
        if (!temporary) {
            this._fixedPoints = points;
            this._drawTime = Date.now();
        }
    }

    /* -------------------------------------------- */

    /**
     * Remove the last fixed point from the polygon
     * @private
     */
    _removePoint() {
        this._fixedPoints.splice(-2);
        this.document.shape.updateSource({ points: this._fixedPoints });
    }

    /* -------------------------------------------- */
    /*  Database Operations                         */
    /* -------------------------------------------- */

    /** @override */
    _onUpdate(changed, options, userId) {
        //if (changed.environment != undefined)
        //    this.document.updateEnvironment();

        changed.multiple = Math.clamped(changed.multiple, setting('minimum-cost'), setting('maximum-cost'));

        // Full re-draw or partial refresh
        if (changed.has("multiple") || changed.has("environment"))
            this.draw().then(() => super._onUpdate(changed, options, userId));
        else {
            this.refresh();
            super._onUpdate(changed, options, userId);
        }

        // Update the sheet, if it's visible
        //if (this._sheet && this._sheet.rendered) this.sheet.render();
    }

    /* -------------------------------------------- */
    /*  Interactivity                               */
/* -------------------------------------------- */

    /** @override */
    _canControl(user, event) {
        if (this._creating) {  // Allow one-time control immediately following creation
            delete this._creating;
            return true;
        }
        if (this.controlled) return true;
        if (game.activeTool !== "select") return false;
        return user.isGM;
    }

    /** @override */
    _canHUD(user, event) {
        return this.controlled;
    }

    /* -------------------------------------------- */

    /** @override */
    _canConfigure(user, event) {
        if (!this.controlled) return false;
        return super._canConfigure(user);
    }

    /* -------------------------------------------- */
    /*  Event Listeners and Handlers                */
    /* -------------------------------------------- */

    /** @override */
    activateListeners() {
        super.activateListeners();
        this.frame.handle.off("mouseover").off("mouseout").off("mousedown")
            .on("mouseover", this._onHandleHoverIn.bind(this))
            .on("mouseout", this._onHandleHoverOut.bind(this))
            .on("mousedown", this._onHandleMouseDown.bind(this));
        this.frame.handle.interactive = true;
    }

    /* -------------------------------------------- */

    /**
     * Handle mouse movement which modifies the dimensions of the drawn shape
     * @param {PIXI.interaction.InteractionEvent} event
     * @private
     */
    _onMouseDraw(event) {
        const { destination, origin, originalEvent } = event.data;
        const isShift = originalEvent.shiftKey;
        const isAlt = originalEvent.altKey;
        let position = destination;

        switch (this.type) {

            // Polygon Shapes
            case Drawing.SHAPE_TYPES.POLYGON:
                const isFreehand = game.activeTool === "freehand";
                let temporary = true;
                if (isFreehand) {
                    const now = Date.now();
                    temporary = (now - this._drawTime) < this.constructor.FREEHAND_SAMPLE_RATE;
                }
                const snap = !(isShift || isFreehand);
                this._addPoint(position, { snap, temporary });
                break;

            // Other Shapes
            default:
                const shape = this.shape;
                const minSize = canvas.dimensions.size * 0.5;
                let dx = position.x - origin.x;
                let dy = position.y - origin.y;
                if (Math.abs(dx) < minSize) dx = minSize * Math.sign(shape.width);
                if (Math.abs(dy) < minSize) dy = minSize * Math.sign(shape.height);
                if (isAlt) {
                    dx = Math.abs(dy) < Math.abs(dx) ? Math.abs(dy) * Math.sign(dx) : dx;
                    dy = Math.abs(dx) < Math.abs(dy) ? Math.abs(dx) * Math.sign(dy) : dy;
                }
                const r = new PIXI.Rectangle(origin.x, origin.y, dx, dy).normalize();
                this.document.updateSource({
                    x: r.x,
                    y: r.y,
                    shape: {
                        width: r.width,
                        height: r.height
                    }
                });
                break;
        }

        // Refresh the display
        this.refresh();
    }

    /* -------------------------------------------- */
    /*  Interactivity                               */
    /* -------------------------------------------- */

    /** @override */
    _onDragLeftStart(event) {
        if (this._dragHandle) return this._onHandleDragStart(event);
        return super._onDragLeftStart(event);
    }

    /* -------------------------------------------- */

    /** @override */
    _onDragLeftMove(event) {
        if (this._dragHandle) return this._onHandleDragMove(event);
        return super._onDragLeftMove(event);
    }

    /* -------------------------------------------- */

    /** @override */
    _onDragLeftDrop(event) {
        if (this._dragHandle) return this._onHandleDragDrop(event);

        // Update each dragged Terrain
        const clones = event.data.clones || [];
        const updates = clones.map(c => {
            let dest = { x: c.document.x, y: c.document.y };
            if (!event.data.originalEvent.shiftKey) {
                dest = canvas.grid.getSnappedPosition(dest.x, dest.y, this.layer.gridPrecision);
            }

            // Define the update
            const update = {
                _id: c._original.id,
                x: dest.x,
                y: dest.y
            };

            // Hide the original until after the update processes
            c.visible = false;
            c._original.visible = false;
            return update;
        });
        return canvas.scene.updateEmbeddedDocuments("Terrain", updates, { diff: false }).then(() => {
            for (let clone of clones) {
                clone._original.visible = true;
            }
        });
    }

    /* -------------------------------------------- */

    /** @override */
    _onDragLeftCancel(event) {
        if (this._dragHandle) return this._onHandleDragCancel(event);
        return super._onDragLeftCancel(event);
    }

    /** @inheritDoc */
    _onDragStart() {
        super._onDragStart();
        const o = this._original;
        o.shape.alpha = o.alpha;
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    _onDragEnd() {
        super._onDragEnd();
        if (this.isPreview) this._original.shape.alpha = 1.0;
    }

    /* -------------------------------------------- */
    /*  Resize Handling                             */
    /* -------------------------------------------- */

    /**
     * Handle mouse-over event on a control handle
     * @param {PIXI.interaction.InteractionEvent} event   The mouseover event
     * @private
     */
    _onHandleHoverIn(event) {
        const handle = event.target;
        handle.scale.set(1.5, 1.5);
        event.data.handle = event.target;
    }

    /* -------------------------------------------- */

    /**
     * Handle mouse-out event on a control handle
     * @param {PIXI.interaction.InteractionEvent} event   The mouseout event
     * @private
     */
    _onHandleHoverOut(event) {
        event.data.handle.scale.set(1.0, 1.0);
        if (this.mouseInteractionManager.state < MouseInteractionManager.INTERACTION_STATES.CLICKED) {
            this._dragHandle = false;
        }
    }

    /* -------------------------------------------- */

    /**
     * When we start a drag event - create a preview copy of the Tile for re-positioning
     * @param {PIXI.interaction.InteractionEvent} event   The mousedown event
     * @private
     */
    _onHandleMouseDown(event) {
        if (!this.document.locked) {
            this._dragHandle = true;
            this._original = this.document.toObject();
        }
    }

    /* -------------------------------------------- */

    /**
     * Handle the beginning of a drag event on a resize handle
     * @param event
     * @private
     */
    _onHandleDragStart(event) {
        /*
        const handle = event.data.handle;
        const aw = Math.abs(this.document.width);
        const ah = Math.abs(this.document.height);
        const x0 = this.document.x + (handle.offset[0] * aw);
        const y0 = this.document.y + (handle.offset[1] * ah);
        event.data.origin = { x: x0, y: y0, width: aw, height: ah };
        this.resizing = true;
        */
        event.data.origin = { x: this.bounds.right, y: this.bounds.bottom };
    }

    /* -------------------------------------------- */

    /**
     * Handle mousemove while dragging a tile scale handler
     * @param {PIXI.interaction.InteractionEvent} event   The mousemove event
     * @private
     */
    _onHandleDragMove(event) {
        const { destination, origin, originalEvent } = event.data;

        // Pan the canvas if the drag event approaches the edge
        canvas._onDragCanvasPan(originalEvent);

        // Update Terrain dimensions
        const dx = destination.x - origin.x;
        const dy = destination.y - origin.y;
        const normalized = this._rescaleDimensions(this._original, dx, dy);
        try {
            this.document.updateSource(normalized);
            this.refresh();
        } catch (err) { }
    }

    /* -------------------------------------------- */

    /**
     * Handle mouseup after dragging a tile scale handler
     * @param {PIXI.interaction.InteractionEvent} event   The mouseup event
     * @private
     */
    _onHandleDragDrop(event) {
        let { destination, origin, originalEvent } = event.data;
        if (!originalEvent.shiftKey) {
            destination = canvas.grid.getSnappedPosition(destination.x, destination.y, this.layer.gridPrecision);
        }

        // Update dimensions
        const dx = destination.x - origin.x;
        const dy = destination.y - origin.y;
        const update = this._rescaleDimensions(this._original, dx, dy);
        return this.document.update(update, { diff: false });
        //this.resizing = false;
        //delete this._original;  //delete the original so that the drag cancel doesn't erase our changes.

        //this._positionOverlay();

        // Commit the update
        //return this.document.update(this.document.data, { diff: false });
    }

    /* -------------------------------------------- */

    /**
     * Handle cancellation of a drag event for one of the resizing handles
     * @private
     */
    _onHandleDragCancel(event) {
        //if (this._original)
        //    this.document.data.update(this._original);
        this.document.updateSource(this._original);
        this._dragHandle = false;
        delete this._original;
        this.refresh();
    }

    /* -------------------------------------------- */

    /**
     * Apply a vectorized rescaling transformation for the terrain data
     * @param {Object} original     The original terrain data
     * @param {number} dx           The pixel distance dragged in the horizontal direction
     * @param {number} dy           The pixel distance dragged in the vertical direction
     * @private
     */
    _rescaleDimensions(original, dx, dy) {
        let { points, width, height } = original.shape;
        width += dx;
        height += dy;
        points = points || [];

        // Rescale polygon points
        if (this.isPolygon) {
            const scaleX = 1 + (dx / original.shape.width);
            const scaleY = 1 + (dy / original.shape.height);
            points = points.map((p, i) => p * (i % 2 ? scaleY : scaleX));
        }

        return this.constructor.normalizeShape({
            x: original.x,
            y: original.y,
            shape: { width: Math.roundFast(width), height: Math.roundFast(height), points }
        });
    }

    /* -------------------------------------------- */

    /**
     * Adjust the location, dimensions, and points of the Terrain before committing the change
     * @param {Object} data   The Terrain data pending update
     * @return {Object}       The adjusted data
     * @private
     */
    static normalizeShape(data) {
        // Adjust shapes with an explicit points array
        const rawPoints = data.shape.points;
        if (rawPoints?.length) {

            // Organize raw points and de-dupe any points which repeated in sequence
            const xs = [];
            const ys = [];
            for (let i = 1; i < rawPoints.length; i += 2) {
                const x0 = rawPoints[i - 3];
                const y0 = rawPoints[i - 2];
                const x1 = rawPoints[i - 1];
                const y1 = rawPoints[i];
                if ((x1 === x0) && (y1 === y0)) {
                    continue;
                }
                xs.push(x1);
                ys.push(y1);
            }

            // Determine minimal and maximal points
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);

            // Normalize points relative to minX and minY
            const points = [];
            for (let i = 0; i < xs.length; i++) {
                points.push(xs[i] - minX, ys[i] - minY);
            }

            // Update data
            data.x += minX;
            data.y += minY;
            data.shape.width = maxX - minX;
            data.shape.height = maxY - minY;
            data.shape.points = points;
        }// Adjust rectangles
        else {
            const normalized = new PIXI.Rectangle(data.x, data.y, data.shape.width, data.shape.height).normalize();
            data.x = normalized.x;
            data.y = normalized.y;
            data.shape.width = normalized.width;
            data.shape.height = normalized.height;
        }
        return data;
    }
}