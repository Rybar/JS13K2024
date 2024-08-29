import { callOnce } from "../core/utils";

export default class Portal {
    constructor(x, y) {
        this.x = x*8;
        this.y = y*8;
        this.size = 20;
        this.fill = 39;
        this.active = false;
        this.nextLevel = callOnce(() => {
            nextLevel();
        })
    }

    draw(r, view) {
        r.renderTarget = r.SCREEN;
        r.fCircle(this.x - view.x, this.y - view.y, this.size, this.fill);
    }

    update(P) {
        let dx = P.x - this.x;
        let dy = P.y - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (P.completeAltarTorchCount >= 13) { 
            this.active = true;   
        }
        if(dist < 10 && this.active) {
            this.nextLevel();
        }
    }
}