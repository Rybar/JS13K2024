import { inView, rand } from "../core/utils";
export default class map {
    constructor(width, height, tileSize, bufferPage){
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.bufferPage = bufferPage;
        this.tiles = new Uint8Array(width * height);
        this.drawTiles = new Uint8Array(width * height);
        this.firstDrawColors = new Uint8Array(width * height);
        this.secondDrawColors = new Uint8Array(width * height);
        this.rooms = [];
        this.torches = [];
        this.P = null;
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
                let drawTileIndex = tile === 0 ? r.LCG.choice([1,2,3,4]) : r.LCG.choice([1,2]);
                let drawTileColors = tile == 0 ? [50,51] : [34,35];
                this.tiles[y * this.width + x] = tile;
                this.drawTiles[y * this.width + x] = drawTileIndex;
                this.firstDrawColors[y * this.width + x] = drawTileColors[0];
                this.secondDrawColors[y * this.width + x] = drawTileColors[1];
            }
        }
        //0 is walkable. find border tiles outside walkables and set border tiles
        let borderTile = 1, firstColor = 40, secondColor = 38;
        for(let y = 0; y < this.height; y++){
            for(let x = 0; x < this.width; x++){
                let index = y * this.width + x;
                let left = index - 1, right = index + 1, up = index - this.width, down = index + this.width;
                if(this.tiles[index] === 0){
                    if(this.tiles[left] !== 0){
                        this.drawTiles[index] = borderTile;
                        this.firstDrawColors[index] = firstColor;
                        this.secondDrawColors[index] = secondColor;
                    }
                    if(this.tiles[right] !== 0){
                        this.drawTiles[index] = borderTile;
                        this.firstDrawColors[index] = firstColor;
                        this.secondDrawColors[index] = secondColor;
                    }
                    if(this.tiles[up] !== 0){
                        this.drawTiles[index] = borderTile;
                        this.firstDrawColors[index] = firstColor;
                        this.secondDrawColors[index] = secondColor;
                    }
                    if(this.tiles[down] !== 0){
                        this.drawTiles[index] = borderTile;
                        this.firstDrawColors[index] = firstColor;
                        this.secondDrawColors[index] = secondColor;
                    }
                }
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
                        let drawTile = this.drawTiles[y * this.width + x];
                        let firstColor = this.firstDrawColors[y * this.width + x];
                        let secondColor = this.secondDrawColors[y * this.width + x];
                        r.drawTile(
                            drawTile,
                            x * this.tileSize - view.x,
                            y * this.tileSize - view.y,
                            firstColor, secondColor
                        )
                }
            }
        }
    }

    getTileAtPixel(x, y){
        return this.tiles[Math.floor(y / this.tileSize) * this.width + Math.floor(x / this.tileSize)];
    }
}