import { inView, rand } from "../core/utils";
export default class map {
    constructor(width, height, tileSize, bufferPage){
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.bufferPage = bufferPage;
        this.tiles = new Uint8Array(width * height);
        this.drawTiles = new Uint8Array(width * height);
        this.rooms = [];
        this.torches = [];
        this.player = null;
        this.preGenerate();
        this.generate();
        
        this.startTileX = 0;
        this.startTileY = 0;
        this.endTileX = 0;
        this.endTileY = 0;
    }

    preGenerate(){
        //fill page 4

        //fill page 6
    }

    generate(){
        //draw room current states to bufferPage
        //draw to buffer for tilemap
        r.renderTarget = r.PAGE_3;
        r.clear(0, r.PAGE_3);
        rooms.forEach(room => {
            room.draw(r, {x: 0, y: 0});
        })
        r.renderTarget = r.SCREEN;
        //load walkable tiles from bufferPage into tiles array
        for(let y = 0; y < this.height; y++){
            for(let x = 0; x < this.width; x++){
                let tile = r.ram[this.bufferPage + y * this.width + x];
                let drawTile = tile === 0 ? r.LCG.choice([35,36,37,38]) : r.LCG.choice([34,35]);
                this.tiles[y * this.width + x] = tile;
                this.drawTiles[y * this.width + x] = drawTile;
            }
        }

    }

    update(){
        this.generate();
    }

    draw(r, view){
        r.LCG.state = Math.floor(view.x/w) + Math.floor(view.y/h);
        for(let y = 0; y < this.height; y++){
            for(let x = 0; x < this.width; x++){
                //if(this.tiles[y * this.width + x] === 0) continue;
                if(inView(
                    {x: x * this.tileSize,
                     y: y * this.tileSize,
                    },8)){
                        r.renderTarget = r.SCREEN;
                        let currentTile = this.tiles[y * this.width + x];
                        if(currentTile === 0){
                            r.drawTile(
                                this.drawTiles[y * this.width + x],
                                x * this.tileSize - view.x,
                                y * this.tileSize - view.y,
                                50, 51
                            );
                        }else {
                            r.drawTile(
                                this.drawTiles[y * this.width + x],
                                x * this.tileSize - view.x,
                                y * this.tileSize - view.y,
                                34, 35
                            );
                        }
                }
            }
        }
    }

    getTileAtPixel(x, y){
        return this.tiles[Math.floor(y / this.tileSize) * this.width + Math.floor(x / this.tileSize)];
    }
}