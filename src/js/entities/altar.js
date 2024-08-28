import Torch from './torch.js';
import Particle from './particle.js';   
import { callOnce, inView, lightRadial, randFloat } from '../core/utils.js';
export default class Altar {
    constructor(x, y, torchCount=3) {
        this.x = x*8;
        this.y = y*8;
        this.radius = 40;
        this.torchCount = torchCount;
        this.torches = [];
        this.lit = false;
        this.annointed = false;
        this.fill = 13;
        this.completeColor = 10;
        this.generateTorches();
        this.bloodRequired = 20;
        this.playerCompleted = callOnce(() => {
            player.completeAltarTorchCount += this.torchCount;
            //emit particles
            for(let i = 0; i < 300; i++) {
                let angle = Math.random() * Math.PI * 2;
                let x = this.x + Math.cos(angle) * 6;
                let y = this.y + Math.sin(angle) * 6;
                entitiesArray.push(new Particle(x, y, randFloat(-2, 2), randFloat(-2, 2),
                {
                    color: [22,9,10,11,12,13,14,15],
                    life: 100,
                    customUpdate: (particle) => {
                        particle.yVelocity += randFloat(-0.5, 0.5);
                        particle.xVelocity += randFloat(-0.5, 0.5);
                    }
                    }));
                }
        })
        this.annointedComplete = callOnce(() => {
            
            });
            
    }

    update() {
        this.torches.forEach(torch => torch.update());
        this.lit = this.torches.filter(torch => torch.lit).length === this.torchCount;
        this.annointed = this.lit && this.bloodRequired === 0;
        if(this.annointed) {
            this.fill = this.completeColor;
            this.annointedComplete();
            //emit particles
            for(let i = 0; i < 4; i++) {
                let angle = Math.random() * Math.PI * 2;
                let x = this.x + Math.cos(angle) * 6;
                let y = this.y + Math.sin(angle) * 6;
                entitiesArray.push(new Particle(x, y, randFloat(-.05, .05), randFloat(-.1, -.3), {color: [14,13,12,11,10], life: 30}));
            }
            //can't be unlit
            this.lit = true;
            this.torches.forEach(torch => {torch.health = 25, torch.annointed = true});
            this.playerCompleted();
        }
        this.fill = this.annointed ? this.completeColor : 12;
        if(this.lit && this.bloodRequired > 0) {

            //distance to player
            let dx = player.x - this.x;
            let dy = player.y - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < 20) {
                if(player.gremlinBlood > 0) {
                    this.bloodRequired--;
                    player.gremlinBlood--;
                }

            }
        }
    }

    draw(r, view) {
        if(!inView({x: this.x, y: this.y}, 40)) return
        //draw lines connecting torches
        for(let i = 0; i < this.torchCount; i++) {
            let torch = this.torches[i];
            let nextTorch = this.torches[(i + 1) % this.torchCount];
            let lineColor = torch.lit && nextTorch.lit ? 22 : 1;
            r.line(torch.x - view.x, torch.y - view.y, nextTorch.x - view.x, nextTorch.y - view.y, lineColor);
        }
        //draw lines connecting torches to altar
        for(let i = 0; i < this.torchCount; i++) {
            let torch = this.torches[i];
            let lineColor = torch.lit ? 22 : 2;
            r.line(this.x - view.x, this.y - view.y, torch.x - view.x, torch.y - view.y, lineColor);
        }
        //draw the altar
        r.fCircle(this.x - view.x, this.y - view.y, 8, this.fill);
        //draw the torches
        for(let i = 0; i < this.torchCount; i++) {
            this.torches[i].draw(r, view);
        }

        //ambient light
        lightRadial(
            this.x - view.x,
            this.y - view.y,
             100, 
             [2, 3, 4]);

        //bloodRequired text
        r.text(this.bloodRequired.toString(), this.x - view.x, this.y - view.y + 8, 1, 1, 'center', 'top', 1, 22);
        
    }

    generateTorches() {
        //arrange torches in a circle around the altar center
        let angle = 0;
        let angleStep = (Math.PI*2) / this.torchCount;
        for(let i = 0; i < this.torchCount; i++) {
            let x = this.x + Math.cos(angle) * this.radius;
            let y = this.y + Math.sin(angle) * this.radius;
            this.torches.push(new Torch(x, y));
            angle += angleStep;
        }
    }

}