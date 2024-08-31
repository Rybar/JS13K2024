import { callOnce } from "../core/utils";

export default class Portal {
    constructor(x, y) {
        this.x = x*tileSize;
        this.y = y*tileSize;
        this.size = 20;
        this.fill = 39;
        this.active = false;
        this.nextLevel = callOnce(() => {
            window.nextLevel();
        })
    }

    draw(r, view) {
        r._renderTarget = r["SCREEN"];
        r.fCircle(this.x - view.x, this.y - view.y, this.size, this.fill);
    }

    update(P) {
        let dx = P.x - this.x;
        let dy = P.y - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (P.sumCompletedTorches() >= 13) { 
            this.active = true;   
        }
        if(dist < 10 && this.active) {
            this.nextLevel();
        }
    }
}