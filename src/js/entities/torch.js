import Particle from './particle';
import { randFloat, rand, lightRadial, playSound} from '../core/utils';
export default class Torch {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 3;
        this.health = 0;
        this.lit = false;
        this.igniting = false;
        this.annointed = false;
        this.fill=2;
    }

    draw(r, view) {
        //console.log('Torch draw');
        r.renderTarget = r["SCREEN"];
        r.fCircle(this.x - view.x, this.y - view.y, this.size, this.fill);
        if(this.lit) {
            lightRadial(this.x - view.x, this.y - view.y, 25, [0,1,2,3, 4]);
        }
    }

    update() {
        this.fill = this.lit ? 6 : 63;
        this.fill = this.annointed ? 10 : this.fill;
        let gradient = this.annointed ? [10,11,12,13,14,15] : [22,8,7,6,5,4,3,2,1];
        if(this.lit){
            entitiesArray.push(new Particle(
                this.x + rand(-2,2), this.y,
                randFloat(-0.05,0.05),
                -0.25, {color: gradient, life: 70}));
        }
        //check for overlap with P. If so, light the torch.
        //will require action to light the torch in the future
        let dx = P.x - this.x;
        let dy = P.y - this.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < 10 && !this.lit && !this.igniting) {
            this.health = 25;
            this.lit = true;
            this.igniting = true;
        }
        if(this.health <= 0) {
            this.lit = false;
        }
        if(this.igniting) {
            playSound(sounds.torch);
            this.igniting = false;
        }
    }
}