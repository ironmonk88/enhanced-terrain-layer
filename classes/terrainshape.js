import { makeid, log, setting, debug, getflag } from '../terrain-main.js';

export class TerrainShape extends DrawingShape {
    refresh() {
        if (this._destroyed) return;
        const doc = this.document;
        this.clear();

        let drawAlpha = (ui.controls.activeControl == 'terrain' ? 1.0 : doc.alpha);

        // Outer Stroke
        let sc = Color.from(doc.color || "#FFFFFF");
        let lStyle = new PIXI.LineStyle();
        mergeObject(lStyle, { width: doc.strokeWidth, color: sc, alpha: (setting('draw-border') ? drawAlpha : 0), cap: PIXI.LINE_CAP.ROUND, join: PIXI.LINE_JOIN.ROUND, visible: true });
        this.lineStyle(lStyle);

        // Fill Color or Texture
        if (doc.fillType) {
            const fc = Color.from(doc.color || "#FFFFFF");
            if ((doc.fillType === CONST.DRAWING_FILL_TYPES.PATTERN)) {
                if (this.object.texture) {
                    let sW = (canvas.dimensions.size / (this.object.texture.width * (setting('terrain-image') == 'diagonal' ? 2 : 1)));
                    let sH = (canvas.dimensions.size / (this.object.texture.height * (setting('terrain-image') == 'diagonal' ? 2 : 1)));
                    this.beginTextureFill({
                        texture: this.object.texture,
                        color: fc || 0xFFFFFF,
                        alpha: drawAlpha,
                        matrix: new PIXI.Matrix().scale(sW, sH)
                    });
                }
            } else this.beginFill(fc, doc.fillAlpha);
        }

        // Draw the shape
        switch (doc.shape.type) {
            case Drawing.SHAPE_TYPES.RECTANGLE:
                this.#drawRectangle();
                break;
            case Drawing.SHAPE_TYPES.ELLIPSE:
                this.#drawEllipse();
                break;
            case Drawing.SHAPE_TYPES.POLYGON:
                if (this.document.bezierFactor) this.#drawFreehand();
                else this.#drawPolygon();
                break;
        }

        // Conclude fills
        this.lineStyle(0x000000, 0.0).closePath().endFill();

        // Set the drawing position
        this.setPosition();
    }

    get _pixishape() {
        let { x, y, width, height, shape } = this.document;
        let result;
        switch (shape.type) {
            case Drawing.SHAPE_TYPES.RECTANGLE:
                result = new PIXI.Rectangle(0, 0, width, height);
                break;
            case Drawing.SHAPE_TYPES.ELLIPSE:
                result = new PIXI.Ellipse(width / 2, height / 2, Math.max(Math.abs(width / 2), 0), Math.max(Math.abs(height / 2), 0));
                break;
            case Drawing.SHAPE_TYPES.POLYGON:
                result = new PIXI.Polygon(shape.points);
                break;
        }
        return result;
    }

    contains(x, y) {
        let shape = this._pixishape;
        if (shape)
            return shape.contains(x, y);
        return false;
    }

    /* -------------------------------------------- */

    /**
     * Draw rectangular shapes.
     * @private
     */
    #drawRectangle() {
        const { shape, strokeWidth } = this.document;
        const hs = strokeWidth / 2;

        if (this.document.hidden) {
            this.drawDashedPolygon([0, 0, shape.width, 0, shape.width, shape.height, 0, shape.height,0, 0], 0, 0, 0, strokeWidth * 2, strokeWidth * 3, 0);
            this._lineStyle.width = 0;
        }
        this.drawRect(hs, hs, shape.width - (2 * hs), shape.height - (2 * hs));

        this._lineStyle.width = strokeWidth;
    }

    /* -------------------------------------------- */

    /**
     * Draw ellipsoid shapes.
     * @private
     */
    #drawEllipse() {
        const { shape, strokeWidth } = this.document;
        const hw = shape.width / 2;
        const hh = shape.height / 2;
        const hs = strokeWidth / 2;
        const width = Math.max(Math.abs(hw) - hs, 0);
        const height = Math.max(Math.abs(hh) - hs, 0);
        this.drawEllipse(hw, hh, width, height);
    }

    /* -------------------------------------------- */

    /**
     * Draw polygonal shapes.
     * @private
     */
    #drawPolygon() {
        const { shape, strokeWidth } = this.document;
        const points = shape.points;
        if (points.length < 4) return;
        else if (points.length === 4) this.endFill();

        if (this.document.hidden) {
            this.drawDashedPolygon(points, 0, 0, 0, strokeWidth * 2, strokeWidth * 3, 0);
            this._lineStyle.width = 0;
        }
        this.drawPolygon(points);
        this._lineStyle.width = strokeWidth;
    }

    /* -------------------------------------------- */

    /**
     * Draw freehand shapes with bezier spline smoothing.
     * @private
     */
    #drawFreehand() {
        const { bezierFactor, fillType, shape } = this.document;

        // Get drawing points
        let points = shape.points;

        // Draw simple polygons if only 2 points are present
        if (points.length <= 4) return this.#drawPolygon();

        // Set initial conditions
        const factor = bezierFactor ?? 0.5;
        let previous = first;
        let point = points.slice(2, 4);
        points = points.concat(last);  // Repeat the final point so the bezier control points know how to finish
        let cp0 = this.#getBezierControlPoints(factor, last, previous, point).nextCP;
        let cp1;
        let nextCP;

        // Begin iteration
        this.moveTo(first[0], first[1]);
        for (let i = 4; i < points.length - 1; i += 2) {
            const next = [points[i], points[i + 1]];
            if (next) {
                let bp = this.#getBezierControlPoints(factor, previous, point, next);
                cp1 = bp.cp1;
                nextCP = bp.nextCP;
            }

            // First point
            if ((i === 4) && !isClosed) {
                this.quadraticCurveTo(cp1.x, cp1.y, point[0], point[1]);
            }

            // Last Point
            else if ((i === points.length - 2) && !isClosed) {
                this.quadraticCurveTo(cp0.x, cp0.y, point[0], point[1]);
            }

            // Bezier points
            else {
                this.bezierCurveTo(cp0.x, cp0.y, cp1.x, cp1.y, point[0], point[1]);
            }

            // Increment
            previous = point;
            point = next;
            cp0 = nextCP;
        }
    }

    /* -------------------------------------------- */

    /**
     * Attribution: The equations for how to calculate the bezier control points are derived from Rob Spencer's article:
     * http://scaledinnovation.com/analytics/splines/aboutSplines.html
     * @param {number} factor       The smoothing factor
     * @param {number[]} previous   The prior point
     * @param {number[]} point      The current point
     * @param {number[]} next       The next point
     * @returns {{cp1: Point, nextCP: Point}} The bezier control points
     * @private
     */
    #getBezierControlPoints(factor, previous, point, next) {

        // Calculate distance vectors
        const vector = { x: next[0] - previous[0], y: next[1] - previous[1] };
        const preDistance = Math.hypot(point[0] - previous[0], point[1] - previous[1]);
        const postDistance = Math.hypot(next[0] - point[0], next[1] - point[1]);
        const distance = preDistance + postDistance;

        // Compute control point locations
        const cp0d = distance === 0 ? 0 : factor * (preDistance / distance);
        const cp1d = distance === 0 ? 0 : factor * (postDistance / distance);

        // Return points
        return {
            cp1: {
                x: point[0] - (vector.x * cp0d),
                y: point[1] - (vector.y * cp0d)
            },
            nextCP: {
                x: point[0] + (vector.x * cp1d),
                y: point[1] + (vector.y * cp1d)
            }
        };
    }

    drawDashedPolygon(points, x, y, rotation, dash, gap, offsetPercentage) {
        var i;
        var p1;
        var p2;
        var dashLeft = 0;
        var gapLeft = 0;
        if (offsetPercentage > 0) {
            var progressOffset = (dash + gap) * offsetPercentage;
            if (progressOffset < dash) dashLeft = dash - progressOffset;
            else gapLeft = gap - (progressOffset - dash);
        }
        var rotatedPolygons = [];
        for (i = 0; i < points.length - 1; i += 2) {
            var p = { x: points[i], y: points[i + 1] };
            var cosAngle = Math.cos(rotation);
            var sinAngle = Math.sin(rotation);
            var dx = p.x;
            var dy = p.y;
            p.x = (dx * cosAngle - dy * sinAngle);
            p.y = (dx * sinAngle + dy * cosAngle);
            rotatedPolygons.push(p);
        }
        for (i = 0; i < rotatedPolygons.length; i++) {
            p1 = rotatedPolygons[i];
            if (i == rotatedPolygons.length - 1) p2 = rotatedPolygons[0];
            else p2 = rotatedPolygons[i + 1];
            var dx = p2.x - p1.x;
            var dy = p2.y - p1.y;
            if (dx == 0 && dy == 0)
                continue;
            var len = Math.sqrt(dx * dx + dy * dy);
            var normal = { x: dx / len, y: dy / len };
            var progressOnLine = 0;
            let mx = x + p1.x + gapLeft * normal.x;
            let my = y + p1.y + gapLeft * normal.y;
            this.moveTo(mx, my);
            while (progressOnLine <= len) {
                progressOnLine += gapLeft;
                if (dashLeft > 0) progressOnLine += dashLeft;
                else progressOnLine += dash;
                if (progressOnLine > len) {
                    dashLeft = progressOnLine - len;
                    progressOnLine = len;
                } else {
                    dashLeft = 0;
                }
                let lx = x + p1.x + progressOnLine * normal.x;
                let ly = y + p1.y + progressOnLine * normal.y;
                this.lineTo(lx, ly);
                progressOnLine += gap;
                if (progressOnLine > len && dashLeft == 0) {
                    gapLeft = progressOnLine - len;
                    //console.log(progressOnLine, len, gap);
                } else {
                    gapLeft = 0;
                    let mx = x + p1.x + progressOnLine * normal.x;
                    let my = y + p1.y + progressOnLine * normal.y;
                    this.moveTo(mx, my);
                }
            }
        }
    }
}