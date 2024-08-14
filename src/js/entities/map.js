import { inView } from "../core/utils";
export default class map {
    constructor(width, height, tileSize, r, bufferPage){
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.r = r;
        this.bufferPage = bufferPage;
        this.tiles = new Uint8Array(width * height);
        this.rooms = [];
        this.torches = [];
        this.player = null;
        this.rooms = rooms;
        this.generate();
    }

    generate(){
        //load walkable tiles from bufferPage into tiles array
        for(let y = 0; y < this.height; y++){
            for(let x = 0; x < this.width; x++){
                this.tiles[y * this.width + x] = this.r.ram[this.bufferPage + y * this.width + x];
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
                    })){
                    r.fRect(x * this.tileSize - view.x,
                        y * this.tileSize - view.y,
                        this.tileSize, this.tileSize,
                        r.ram[this.bufferPage + y * this.width + x]);   
                }
            }
        }
    }
}