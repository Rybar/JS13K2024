import { lightRadial, playSound, rand, tileCollisionCheck, rectangle } from "../core/utils";
import Powerup from "./Powerup";

export default class pot {
    constructor(x, y) {
        this.type = "pot";
        this.x = x * tileSize;
        this.y = y * tileSize;
        this.rectangle = new rectangle(this.x, this.y, 8, 8);
        this.size = 3;
        this.broken = false;
        this.alive = true;
    }
    //a clay pot that can be broken, releasing a health potion
    draw(r, view) {
        r.renderTarget = r["SCREEN"];
        r.fRect(this.x - view.x, this.y - view.y, 6, 1, 43);
        r.fRect(this.x - view.x+1, this.y - view.y+1, 4, 4, 43);
        r.fRect(this.x - view.x, this.y - view.y+5, 6, 1, 43);
        r.fRect(this.x - view.x-1, this.y - view.y+6, 8, 6, 43);

        lightRadial(this.x - view.x, this.y - view.y, 25, [0,1,2,3, 4]);
    }

    update() {
        if(P.isFiring && !this.broken) {
            let dx = P.x - this.x;
            let dy = P.y - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < 20) {
                this.broken = true;
            }
        }
        if(this.broken) {
            for (let i = 0; i < 10; i++) {
                entitiesArray.push(new Powerup("HEALTH", this.x + rand(-15, 15), this.y + rand(-15, 15)));
            }
            playSound(sounds.potBreak);
            this.alive = false;
        }
    }

    hurt(damage) {
        this.broken = true;
    }

}