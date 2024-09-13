import { playSound, randFloat, tileCollisionCheck, lightRadial } from "../core/utils";


export default class Powerup {

    

    constructor(type, x, y){

        this.types = {
            "HEALTH": {
                "life": 500,
                "color": 5,
                "effect" : function (P) {
                    P.health = Math.min(P.health + 10, P.maxHealth);
                }
            },
            "GREMLINBLOOD": {
                "life": 500,
                "color": 11,
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
        this.life = this.type.life;
        this.lifeMax = this.type.life;
        this.color = this.type.color;
        this.effect = this.type.effect;
        this.velocity = {x: randFloat(-1,1), y: randFloat(-1,1)};
    }

    update(){
        this.oldX = this.x;
        this.oldY = this.y;
        this.velocity.x *= 0.8;
        this.velocity.y *= 0.8;
        this.x += this.velocity.x;
        if(tileCollisionCheck(map, this)){
            this.velocity.x *= -1;
        }
        this.y += this.velocity.y;
        if(tileCollisionCheck(map, this)){
            this.velocity.y *= -1;
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
        r.renderTarget = r["SCREEN"];
        r.fRect(this.x - view.x, this.y - view.y, 4, 4, this.color);
        lightRadial(this.x - view.x, this.y - view.y, 9) 

    }



}