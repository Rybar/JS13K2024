import { playSound, randFloat, tileCollisionCheck } from "../core/utils";

export default class Powerup {

    

    constructor(type, x, y){

        this.types = {
            "HEALTH": {
                "life": 500,
                "_color": 5,
                "effect" : function (P) {
                    P.health = Math.min(P.health + 1, P.maxHealth);
                }
            },
            "GREMLIN_BLOOD": {
                "life": 500,
                "_color": 11,
                "effect" : function (P) {
                    P.gremlinBlood += 1;
                }   
            }
        }

        this.x = x;
        this.y = y;
        this.oldX = x;
        this.oldY = y;
        this.alive = true;
        
        this.type = this.types[type];
        this.life = this.type.life
        this.lifeMax = this.type.life;
        this._color = this.type._color;
        this.effect = this.type.effect;
        this._velocity = {x: randFloat(-1,1), y: randFloat(-1,1)};
    }

    update(){
        this.oldX = this.x;
        this.oldY = this.y;
        this._velocity.x *= 0.8;
        this._velocity.y *= 0.8;
        this.x += this._velocity.x;
        if(tileCollisionCheck(map, this)){
            this._velocity.x *= -1;
        }
        this.y += this._velocity.y;
        if(tileCollisionCheck(map, this)){
            this._velocity.y *= -1;
        }
        if (!this.alive) return;
        this.life--;
        if(this.life <= 0){
            this.alive = false;
        }        
        //distance to P
        const distanceToPlayer = Math.hypot(this.x - P.x, this.y - P.y);
        if(distanceToPlayer < 8){
            this.effect(P);
            this.alive = false;
            playSound(sounds.pickup);
        }
    }

    draw(r, view){
        r._renderTarget = r["SCREEN"];
        r._fRect(this.x - view.x, this.y - view.y, 4, 4, this._color);
    }



}