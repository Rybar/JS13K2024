import Particle from './particle';
import { lightRadial, rectangle } from '../core/utils';
export default class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.damage = Math.min(P.gremlinBlood/10 + 5, 10);
        this.speed = 5;
        this.radius = Math.min(P.gremlinBlood/5, 5);
        this.width = this.radius * 2;
        this.height = this.radius * 2;
        this.rectangle = new rectangle(this.x, this.y, this.width, this.height);
        this.alive = true;
        this.life = 1000;
    }
    draw(r, view) {
        r.lCircle(this.x - view.x, this.y - view.y, this.radius+2, 20);
        r.fCircle(this.x - view.x, this.y - view.y, this.radius, 1);
        lightRadial(this.x - view.x, this.y - view.y, this.radius+5) 
    }
    update() {
        if(currentFloor == 13){
            this.damage = 40;
            this.radius = 6;
        }
        //map is global. check if bullet hits wall
        if(map.getTileAtPixel(this.x, this.y) == 0) {
            this.die();
            return;
        }

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.rectangle.x = this.x;
        this.rectangle.y = this.y;
        this.life--;
        if(this.life <= 0) {
            this.alive = false;
        }
    }

    die(){
        this.alive = false;
        lightRadial(this.x, this.y, 50);
        let amount = 100;
        for(let i = 0; i < amount; i++) {
            let angle = Math.random() * Math.PI * 2;
            let x = this.x + Math.cos(angle) * 6;
            let y = this.y + Math.sin(angle) * 6;
            entitiesArray.push(new Particle(x, y, Math.cos(angle) * Math.random() * 2, Math.sin(angle) * Math.random() * 2,
            {
                color: [22,9,10,11,12,13,14,15],
                life: 20,
                customUpdate: (particle) => {
                    particle.yVelocity += Math.random() * 0.1;
                    particle.xVelocity += Math.random() * 0.1;
                }
                }));
            }
    }
    
}