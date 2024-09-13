import { callOnce, lightRadial, radians } from "../core/utils";
import Particle from "./particle";

export default class Portal {
    constructor(x, y) {
        this.x = x*tileSize;
        this.y = y*tileSize;
        this.size = 40;
        this.fill = 16;
        this.active = false;
        this.nextLevel = callOnce(() => {
            window.nextLevel();
        })
    }

    draw(r, view) {
        r.renderTarget = r["SCREEN"];
        r.fCircle(this.x - view.x, this.y - view.y, this.size, this.fill);
        lightRadial(this.x - view.x, this.y - view.y, this.size+10, [0,1,2,3]);
        //draw polygons for completed altars
        P.completeAltars.forEach((altar, i) => {
            let spin = P.sumCompletedTorches() >= 13 ? t/900 : 0;
            r.polygon(this.x - view.x, this.y - view.y, 15+altar*2, altar,
                altar%2==0 ? spin: -spin + radians(i*(360/13)), 22, 22);
        });
        //draw particles around perimeter of portal moving inwards
        for(let i = 0; i < 10; i++) {
            let angle = Math.random() * Math.PI * 2;
            let x = this.x + Math.cos(angle) * this.size;
            let y = this.y + Math.sin(angle) * this.size;
            entitiesArray.push(new Particle(x, y, Math.cos(angle) * -0.2, Math.sin(angle) * -0.2,
            {
                color: this.active? [22,9,10,11,12,13,14,15] : 4,
                life: 50,
                customUpdate: (particle) => {
                    particle.yVelocity += Math.random() * 0.1 - 0.05;
                    particle.xVelocity += Math.random() * 0.1 - 0.05;
                }
                }));
            }

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