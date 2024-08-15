import { inView } from "../core/utils";
export default class map {
    constructor(width, height, tileSize, bufferPage){
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.bufferPage = bufferPage;
        this.tiles = new Uint8Array(width * height);
        this.rooms = [];
        this.torches = [];
        this.player = null;
        this.generate();
        
        this.startTileX = 0;
        this.startTileY = 0;
        this.endTileX = 0;
        this.endTileY = 0;
    }

    generate(){
        //draw room current states to bufferPage
        //draw to buffer for tilemap
        r.renderTarget = r.PAGE_3;
        rooms.forEach(room => {
            room.draw(r, {x: 0, y: 0});
        })
        r.renderTarget = r.SCREEN;
        //load walkable tiles from bufferPage into tiles array
        for(let y = 0; y < this.height; y++){
            for(let x = 0; x < this.width; x++){
                this.tiles[y * this.width + x] = r.ram[this.bufferPage + y * this.width + x];
            }
        }
    }

    update(){
        this.generate();
    }

    draw(r, view){
        for(let y = 0; y < this.height; y++){
            for(let x = 0; x < this.width; x++){
                if(this.tiles[y * this.width + x] === 0) continue;
                if(inView(
                    {x: x * this.tileSize,
                     y: y * this.tileSize,
                    },8)){
                    r.fRect(x * this.tileSize - view.x,
                        y * this.tileSize - view.y,
                        this.tileSize, this.tileSize,
                        r.ram[this.bufferPage + y * this.width + x]);   
                }
            }
        }
    }

    getTileAtPixel(x, y){
        return this.tiles[Math.floor(y / this.tileSize) * this.width + Math.floor(x / this.tileSize)];
    }
}