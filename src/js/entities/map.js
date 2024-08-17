import { inView, rand } from "../core/utils";
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
        this.preGenerate();
        this.generate();
        
        this.startTileX = 0;
        this.startTileY = 0;
        this.endTileX = 0;
        this.endTileY = 0;
    }

    preGenerate(){
        //page 4 and 5 will be used for tile colors, maybe dynamic lighting.
        //page 6 will store tile indexes
        r.renderTarget = r.PAGE_4;
        r.clear(64, r.PAGE_4);
        //fill page 4 with random color fRects
        for(let i = 0; i < 100; i++){
            let x = Math.floor(Math.random() * 480);
            let y = Math.floor(Math.random() * 270);

            r.fRect(x, y, 50, 50, rand(3,63));
        }

        //fill page 5 with random color fRects
        r.renderTarget = r.PAGE_5;
        r.clear(64, r.PAGE_5);
        for(let j = 0; j < 100; j++){
            let x = Math.floor(Math.random() * 480);
            let y = Math.floor(Math.random() * 270);

            r.fRect(x, y, 50, 50, rand(3,63));
        }
        r.renderTarget = r.SCREEN;

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
                //if(this.tiles[y * this.width + x] === 0) continue;
                if(inView(
                    {x: x * this.tileSize,
                     y: y * this.tileSize,
                    },8)){
                        let color1 = r.ram[r.PAGE_4 + y * this.width + x];
                        let color2 = r.ram[r.PAGE_3 + y * this.width + x];
                        r.renderTarget = r.SCREEN;
                        let currentTile = this.tiles[y * this.width + x];
                        if(currentTile === 0){
                            r.drawTile(
                                7,
                                x * this.tileSize - view.x,
                                y * this.tileSize - view.y,
                                1, 2
                            );
                        }else {
                            r.drawTile(
                                38,
                                x * this.tileSize - view.x,
                                y * this.tileSize - view.y,
                                62, 63
                            );
                        }
                    // r.fRect(x * this.tileSize - view.x,
                    //     y * this.tileSize - view.y,
                    //     this.tileSize, this.tileSize,
                    //     r.ram[this.bufferPage + y * this.width + x]);   
                }
            }
        }
    }

    getTileAtPixel(x, y){
        return this.tiles[Math.floor(y / this.tileSize) * this.width + Math.floor(x / this.tileSize)];
    }
}