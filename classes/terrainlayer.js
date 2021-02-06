export let log = (...args) => console.log("terrainlayer | ", ...args);
//TERRAIN LAYER
let TLControlPress = false;
class TerrainSquare extends PIXI.Graphics {
    constructor(coord,...args){
        super(...args);
        this.coord = coord;
        let topLeft = canvas.grid.grid.getPixelsFromGridPosition(coord.x,coord.y)
        this.thePosition = `${topLeft[0]}.${topLeft[1]}`;
    }
}

export class TerrainHighlight extends PIXI.Graphics {
    constructor(name,...args){
        super(...args);

        /**
            * Track the Grid Highlight name
            * @type {String}
            */
        this.name = name;

        /**
            * Track distinct positions which have already been highlighted
            * @type {Set}
            */
        this.visible = canvas.scene.getFlag('TerrainLayer', 'sceneVisibility') || true;
        log('TerrainHighlight:', this.visible);
        this.positions = new Set();
    }

    /* -------------------------------------------- */

    /**
    * Record a position that is highlighted and return whether or not it should be rendered
    * @param {Number} x    The x-coordinate to highlight
    * @param {Number} y    The y-coordinate to highlight
    * @return {Boolean}    Whether or not to draw the highlight for this location
    */
    highlight(pxX, pxY) {
        let key = `${pxX}.${pxY}`;
        if ( this.positions.has(key) ) return false;
        this.positions.add(key);
        return true;
    }

    /* -------------------------------------------- */

    /**
    * Extend the Graphics clear logic to also reset the highlighted positions
    * @param args
    */
    clear(...args) {
        super.clear(...args);
        this.positions = new Set();
    }


    /* -------------------------------------------- */

    /**
    * Extend how this Graphics container is destroyed to also remove parent layer references
    * @param args
    */
    destroy(...args) {
        delete canvas.terrain.highlightLayers[this.name];
        super.destroy(...args);
    }
}

export class TerrainLayer extends CanvasLayer{
	constructor(){
		super();
        this.scene = null;
        // this.sceneId = this.scene._id;
        //this.layerName = `DifficultTerrain.${this.scene._id}`;
        this.highlight = null;
        this.mouseInteractionManager = null;
        this.dragging = false;
        // this._addListeners();
        this.showterrain = false;

    }

    static get layerOptions() {
        return mergeObject(super.layerOptions, {
            zIndex: 20
        });
    }

    async draw(){
        this._deRegisterMouseListeners()
        await super.draw();
        log('draw')
        this.highlightLayers = {};
        this.scene = canvas.scene;
        this.sceneId = this.scene._id;
        this.layerName = `DifficultTerrain.${this.scene._id}`;
        this.highlight = this.addChild(new PIXI.Container());
        this.addHighlightLayer(this.layerName);
        this.costGrid = this.scene.getFlag('TerrainLayer','costGrid') ?? {};
        Hooks.once('canvasReady',this.buildFromCostGrid.bind(this))
        this._addListeners();
        return this;
    }

    async tearDown(){
        log('tearDown')
        super.tearDown();
        this._deRegisterMouseListeners()
        this._deRegisterKeyboardListeners();
    }

    async toggle(show, emit = false){
        //this.highlight.children[0].visible = !this.highlight.children[0].visible;
        if (show == undefined)
            show = !this.showterrain;
        this.showterrain = show;
        if(game.user.isGM && emit){
            //await canvas.scene.setFlag('TerrainLayer','sceneVisibility', this.highlight.children[0].visible )
            game.socket.emit('module.TerrainLayer', { action: 'toggle', arguments: [this.showterrain]})
        }
    }

    _addListeners() {
        // Define callback functions for mouse interaction events
        const callbacks = {
            dragLeftStart: this._onDragLeftStart.bind(this),
            dragLeftMove: this._onDragLeftMove.bind(this),
            clickRight: this._onClickRight.bind(this),
            dragRightMove: this._onDragRightMove.bind(this),
            dragLeftDrop:this._onDragLeftDrop.bind(this)
        };

        // Create and activate the interaction manager
        const permissions = {};
        const mgr = new MouseInteractionManager(this, this, permissions, callbacks);
        this.mouseInteractionManager = mgr.activate();
    }

    addHighlightLayer(name) {
        const layer = this.highlightLayers[name];
        if ( !layer || layer._destroyed ) {
            this.highlightLayers[name] = this.highlight.addChild(new TerrainHighlight(name));
     
            canvas.terrain.highlight.children[0].visible = (typeof canvas.scene.getFlag('TerrainLayer', 'sceneVisibility') != 'undefined') ? canvas.scene.getFlag('TerrainLayer', 'sceneVisibility') : true;
        }
        return this.highlightLayers[name];
    }

    getHighlightLayer(name) {
        return this.highlightLayers[name];
    }

    /**
    * Clear a specific Highlight graphic
    * @param name
    */
    clearHighlightLayer(name) {
        const layer = this.highlightLayers[name];
        if ( layer ) layer.clear();
    }
    /* -------------------------------------------- */

    /**
    * Destroy a specific Highlight graphic
    * @param name
    */
    destroyHighlightLayer(name) {
        const layer = this.highlightLayers[name];
        this.highlight.removeChild(layer);
        layer.destroy();
    }

    highlightPosition(name, options) {
        const layer = this.highlightLayers[name];
        if ( !layer ) return false;
        if(canvas.grid.type == 1)
            this.highlightGridPosition(layer, options);
        else if(canvas.grid.type == 2 || canvas.grid.type == 3 || canvas.grid.type == 4 || canvas.grid.type == 5)
            this.highlightHexPosition(layer,options);
    }

    /** @override */
    highlightGridPosition(layer , {gridX, gridY, multiple=2,type='ground'}={}) {
        //GRID ALREADY HIGHLIGHTED
        let terrainSquare = new TerrainSquare({ x: gridX, y: gridY });

        let gsW = canvas.grid.grid.w;
        let gsH = canvas.grid.grid.h;
    
        let px = canvas.grid.grid.getPixelsFromGridPosition(gridX, gridY);
    
        layer.highlight(px[0],px[1]);        

        terrainSquare.x = px[0];
        terrainSquare.y = px[1];
        terrainSquare.width = gsW;
        terrainSquare.height = gsH;

        let s = canvas.dimensions.size;
        let bit = (s / 16) * (multiple - 1);
        let mid = (s / 2);

        terrainSquare.beginFill(0xffffff, 0.5);
        terrainSquare.lineStyle(1, 0xffffff, 0.5);
        terrainSquare.drawPolygon([0, 0, bit, 0, 0, bit]);
        terrainSquare.drawPolygon([mid - bit, 0, mid + bit, 0, 0, mid + bit, 0, mid - bit]);
        terrainSquare.drawPolygon([s, 0, s, bit, bit, s, 0, s, 0, s - bit, s - bit, 0]);
        terrainSquare.drawPolygon([s, mid - bit, s, mid + bit, mid + bit, s, mid - bit, s]);
        terrainSquare.drawPolygon([s, s, s - bit, s, s, s - bit]);
        terrainSquare.endFill();

        terrainSquare.closePath();
        terrainSquare.blendMode = PIXI.BLEND_MODES.OVERLAY;

        if (game.settings.get('TerrainLayer', 'showText')) {
            let fontsize = (s / 3);
            let text = new PIXI.Text('x' + multiple, { fontFamily: 'Arial', fontSize: fontsize, fill: 0xffffff, opacity: 0.6, align: 'center' });
            text.blendMode = PIXI.BLEND_MODES.OVERLAY;
            text.anchor.set(0.5, 0.5);
            text.x = text.y = mid;
            terrainSquare.addChild(text);
        }

        terrainSquare.alpha = game.settings.get('TerrainLayer', 'opacity');
        layer.addChild(terrainSquare);

        // this.addToCostGrid(gridX,gridY);
    }

    highlightHexPosition(layer,{gridX,gridY,multiple=2,type='ground'}={}){
        let gsW = Math.floor(canvas.grid.grid.w);
        let gsH = Math.round(canvas.grid.grid.h);
   
        let topLeft = canvas.grid.grid.getPixelsFromGridPosition(gridX,gridY)
        let pxX = topLeft[0];
        let pxY = topLeft[1];
  
        const points = canvas.grid.grid.options.columns ? canvas.grid.grid.constructor.flatHexPoints : canvas.grid.grid.constructor.pointyHexPoints;
        const coords = points.reduce((arr, p) => {
            arr.push(topLeft[0] + (p[0]*gsW));
            arr.push(topLeft[1] + (p[1]*gsH));
            return arr;
        }, []);
    
        let col = canvas.grid.grid.columns;
        let even = canvas.grid.grid.even;
     
        let terrainSquare = new TerrainSquare({x:gridX,y:gridY})

        layer.highlight(pxX,pxY);
      
        let offset = gsH* 0.16;

        const halfW = (gsW/2)
    
        terrainSquare.y = topLeft[1];
        terrainSquare.x = topLeft[0];
     
        terrainSquare.width = gsW;
        terrainSquare.height = gsH;
      
        //let text = new PIXI.Text('x'+multiple,{fontFamily : 'Arial', fontSize: 12, fill : 0xffffff,opacity:0.5, align : 'center'})

        if(canvas.grid.type == 4 || canvas.grid.type == 5){
        terrainSquare.lineStyle(4, 0xffffff, 0.5);
        terrainSquare.moveTo(halfW,offset*2);
        terrainSquare.lineTo(offset*2, gsW-(offset*3));
        terrainSquare.lineTo(gsW-(offset*2), gsW-(offset*3));
        terrainSquare.lineTo(halfW, offset*2);
        //text.y = (gsH/2)+3;
        }else{
        terrainSquare.lineStyle(7, 0xffffff, 0.5);
        terrainSquare.moveTo(halfW,offset);
        terrainSquare.lineTo(offset, gsW-offset);
        terrainSquare.lineTo(gsW-offset, gsW-offset);
        terrainSquare.lineTo(halfW, offset);
        //text.y = (gsH/2)+7;
        }
      
        terrainSquare.closePath();
        terrainSquare.blendMode = PIXI.BLEND_MODES.OVERLAY;
   
        /*
        text.blendMode = PIXI.BLEND_MODES.OVERLAY;
        text.anchor.set(0.5,0.5);
        text.x = gsW/2;
      
    
        terrainSquare.addChild(text);
        */
      
        layer.addChild(terrainSquare);
    //  this.addToCostGrid(gridX,gridY,multiple);
    
    }
	_registerMouseListeners() {
	    this.addListener('pointerup', this._pointerUp);
	    this.dragging = false;
	}
	_registerKeyboardListeners() {
  	    $(document).keydown((event) => {
  		
  		    //if (ui.controls.activeControl !== this.layername) return;
  		    switch(event.which){
  			    case 27:
  				    event.stopPropagation();
  				    ui.menu.toggle();
  			        break;
                case 17:
                    TLControlPress = true;
                    break;
  			    default:
  			        break;
  		    }
  	    });
        $(document).keyup((event) => {
            switch (event.which) {
                case 17:
                    TLControlPress = false;
                    break;
                default:
                    break;
            }
        });
    }

	_deRegisterMouseListeners(){
        this.removeListener('pointerup', this._pointerUp);
    }

	_deRegisterKeyboardListeners(){
		$(document).off('keydown')
        $(document).off('keyup');
    }

    async addTerrain(x,y,emit=false,batch=true){
        this.highlightPosition(this.layerName,{gridX:x,gridY:y})
        this.addToCostGrid(x,y);
        if(game.user.isGM && emit){
            if(!batch) await this.updateCostGridFlag();
            const data = {
                action:'addTerrain',
                arguments:[x,y]
            }
            game.socket.emit('module.TerrainLayer', data)
        }
    }
    async updateTerrain(x,y,emit=false,batch=true){
        const layer = canvas.terrain.getHighlightLayer(this.layerName);
            let [pxX,pxY] = canvas.grid.grid.getPixelsFromGridPosition(x,y)
            const key = `${pxX}.${pxY}`;
        let square = this.getSquare(layer,key)

        let cost = this.costGrid[x][y];
        if (cost.multiple < game.settings.get('TerrainLayer','maxMultiple')){
            this.costGrid[x][y].multiple+=1;

        }else{
            this.costGrid[x][y].multiple=2;
        }
            //square.getChildAt(0).text = `x${cost.multiple}`;
        if(game.user.isGM && emit){
            if(!batch) await this.updateCostGridFlag();
            const data = {
                action:'updateTerrain',
                arguments:[x,y]
            }
            game.socket.emit('module.TerrainLayer', data)
        }
    }

	_pointerUp(e) {
        let pos = e.data.getLocalPosition(canvas.app.stage);
        let gridPt = canvas.grid.grid.getGridPositionFromPixels(pos.x,pos.y);
        let [pxX,pxY] = canvas.grid.grid.getPixelsFromGridPosition(gridPt[0],gridPt[1])
        let [x,y] = gridPt;  //Normalize the returned data because it's in [y,x] format
        let gsW = Math.round(canvas.grid.grid.w);
        let gsH = Math.floor(canvas.grid.grid.h);
        let gs = Math.min(gsW,gsH)
        let gridPX = {x:Math.round(x*gsH),y:Math.round(y*gsW)}

        const layer = canvas.terrain.getHighlightLayer(this.layerName);
        if(canvas.grid.type == 0) {
            alert('Difficult Terrain does not work with gridless maps.');
            return false;
        }
        switch(e.data.button){
            case 0:
                if(game.activeTool == 'addterrain' && !this.dragging){
                    if(this.terrainExists(pxX,pxY)){
                        this.updateTerrain(x,y,true,false);
                    }else{
                        this.addTerrain(x,y,true,false)
                    }
                }else if(game.activeTool  == 'subtractterrain'){
                    if(this.terrainExists(pxX,pxY)){
                        this.removeTerrain(x,y,true,false);
                    }
                }
                break;
            default:
                break;
        }
        this.dragging = false;
    }

    terrainExists(pxX,pxY){
        const layer = canvas.terrain.getHighlightLayer(this.layerName);
        const key = `${pxX}.${pxY}`;
        if(layer.positions.has(key)) return true;
        return false
    }

    addToCostGrid(x,y,multiple=2,type='ground'){
        if (typeof this.costGrid[x] === 'undefined')
            this.costGrid[x] = {};
        this.costGrid[x][y]={multiple,type};
    }

    async updateCostGridFlag(){
        let x = duplicate(this.costGrid);
        await canvas.scene.unsetFlag('TerrainLayer','costGrid');
        await canvas.scene.setFlag('TerrainLayer', 'costGrid', x);
    }

    buildFromCostGrid(update=true){
        canvas.terrain.highlight.children[0].removeChildren()
        for(let x in this.costGrid){
            for(let y in this.costGrid[x]){
                this.highlightPosition(this.layerName,{gridX:parseInt(x),gridY:parseInt(y),multiple:this.costGrid[x][y].multiple,update:update})
            }
        }
    }

    async resetGrid(emit=false){
        this.getHighlightLayer(this.layerName).clear();
        this.getHighlightLayer(this.layerName).removeChildren();
        this.costGrid = {}
        //only the GM who fired the event can set flag and emit, otherwise a game with two DM's might fire recursively.
        if(game.user.isGM && emit){
            await this.scene.unsetFlag('TerrainLayer','costGrid');

            game.socket.emit('module.TerrainLayer',{action:'resetGrid',arguments:[]})
        }
    }

    selectSquares(coords){
        const startPx = canvas.grid.grid.getCenter(coords.x,coords.y)
        const startGrid = canvas.grid.grid.getGridPositionFromPixels(startPx[0],startPx[1])

        const endPx =  canvas.grid.grid.getCenter(coords.x+coords.width,coords.y+coords.height)
        const endGrid = canvas.grid.grid.getGridPositionFromPixels(endPx[0],endPx[1])

        for(let x = startGrid[0];x<=endGrid[0];x++){
            for(let y = startGrid[1];y<=endGrid[1];y++){
                if(game.activeTool == 'addterrain' && TLControlPress == false){
                    //this.highlightPosition(this.layerName,{gridX:y,gridY:x})
                    //this.addToCostGrid(x,y);
                    if(!this.terrainExists(y*canvas.dimensions.size,x*canvas.dimensions.size))
                        this.addTerrain(x,y,true,true)
                }else if(game.activeTool == 'subtractterrain' || TLControlPress){
                    this.removeTerrain(x,y,true,true)
                }
            }
        }
        this.updateCostGridFlag();

    }
 
    async removeTerrain(x,y,emit=false,batch=true){
        console.log('removeTerrain')
        const [pxX,pxY] = canvas.grid.grid.getPixelsFromGridPosition(x,y)
        const layer = canvas.terrain.getHighlightLayer(this.layerName);
        const key = `${pxX}.${pxY}`;
        if(!layer.positions.has(key)) return false;
        let square = this.getSquare(layer,key);
        square.destroy();
        layer.positions.delete(key);
        this.removeFromCostGrid(x,y)
        if(game.user.isGM && emit){
            if(!batch) await this.updateCostGridFlag();
            const data = {
                action:'removeTerrain',
                arguments:[x,y]
            }
            game.socket.emit('module.TerrainLayer', data)
        }
    }

    removeFromCostGrid(x,y,emit=false){
        if(typeof this.costGrid[x] == 'undefined') return false;
        if(typeof this.costGrid[x][y] == 'undefined') return false;
      
        delete this.costGrid[x][y];
    }

    getSquare(layer,key){
        let square = layer.children.find((x) => {
            return x.thePosition == key
        });
        return square || false;
    }

    _onDragLeftStart(e){
        this.dragging = true;
    }

    _onDragLeftMove(e){
        if (game.activeTool == "selectterrain" ) return this._onDragSelect(e);
    }

    _onDragSelect(event) {
        // Extract event data
        const {origin, destination} = event.data;

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
    }

    _onDragLeftDrop(e) {
        const tool = game.activeTool;
        // Conclude a select event

        const isSelect = ["selectterrain"].includes(tool);
        if (isSelect) {
            canvas.controls.select.clear();
            canvas.controls.select.active = false;
            if (tool === "addterrain") return this.selectSquares(e.data.coords);
        }
        canvas.controls.select.clear();
    }

    _onClickRight(e){
        /* DELETE TERRAIN SQUARE */
        let pos = e.data.getLocalPosition(canvas.app.stage);
        let gridPt = canvas.grid.grid.getGridPositionFromPixels(pos.x,pos.y);
        let px = canvas.grid.grid.getPixelsFromGridPosition(gridPt[0],gridPt[1])
        //Normalize the returned data because it's in [y,x] format
        let [x,y] = gridPt;

        let key = `${px[0]}.${px[1]}`;
        const layer = canvas.terrain.getHighlightLayer(this.layerName);
        let square = this.getSquare(layer,key)
        if(game.activeTool == 'addterrain' && square){
            this.removeTerrain(x,y,true,false);
        }

        log('click right');
    }

    _onDragRightMove(event) {
        // Extract event data
        const DRAG_SPEED_MODIFIER = 0.8;
        const {cursorTime, origin, destination} = event.data;
        const dx = destination.x - origin.x;
        const dy = destination.y - origin.y;

        // Update the client's cursor position every 100ms
        const now = Date.now();
        if ( (now - (cursorTime || 0)) > 100 ) {
            if ( canvas.controls ) canvas.controls._onMoveCursor(event, destination);
            event.data.cursorTime = now;
        }

        // Pan the canvas
        canvas.pan({
            x: canvas.stage.pivot.x - (dx * DRAG_SPEED_MODIFIER),
            y: canvas.stage.pivot.y - (dy * DRAG_SPEED_MODIFIER)
        });
    }

    activate() {
        super.activate();
            const options = this.constructor.layerOptions;
        this.interactive = true;
        this._registerMouseListeners();
        this._registerKeyboardListeners();
        //canvas.activeLayer = canvas.terrain;
    }
	/**
	* Actions upon layer becoming inactive
	*/
	deactivate() {
		super.deactivate();
		this.interactive = false;
		this._deRegisterMouseListeners();
		this._deRegisterKeyboardListeners();
	}
}
