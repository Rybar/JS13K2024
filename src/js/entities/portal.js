import { callOnce, radians } from "../core/utils";

export default class Portal {
    constructor(x, y) {
        this.x = x*tileSize;
        this.y = y*tileSize;
        this.size = 40;
        this.fill = 1;
        this.active = false;
        this.nextLevel = callOnce(() => {
            window.nextLevel();
        })
    }

    draw(r, view) {
        r.renderTarget = r["SCREEN"];
        r.fCircle(this.x - view.x, this.y - view.y, this.size, this.fill);
        //draw polygons for completed altars
        P.completeAltars.forEach((altar, i) => {
            let spin = P.sumCompletedTorches() >= 13 ? t/900 : 0;
            r.polygon(this.x - view.x, this.y - view.y, 15+altar*2, altar,
                altar%2==0 ? spin: -spin + radians(i*(360/13)), 22, 22);
        });
    }

    update(P) {
        let dx = P.x - this.x;
        let dy = P.y - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (P.sumCompletedTorches() >= 13) { 
            this.active = true;   
        }else {
            this.active = false;
        }
        if(dist < 10 && this.active) {
            floorCompleteTime = t;
            this.nextLevel();
        }
    }
}