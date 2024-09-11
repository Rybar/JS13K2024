import { lightRadial, rectangle } from '../core/utils';
export default class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.damage = Math.max(P.gremlinBlood/5 + 5, 5);
        this.speed = 5;
        this.radius = Math.max(P.gremlinBlood/5, 3);
        this.width = this.radius * 2;
        this.height = this.radius * 2;
        this.rectangle = new rectangle(this.x, this.y, this.width, this.height);
        this.alive = true;
        this.life = 1000;
    }
    draw(r, view) {
        r.fCircle(this.x - view.x, this.y - view.y, this.radius, 6);
        lightRadial(this.x - view.x, this.y - view.y, this.radius+5) 
    }
    update() {
        //map is global. check if bullet hits wall
        if(map.getTileAtPixel(this.x, this.y) == 0) {
            console.log(map.getTileAtPixel(this.x, this.y));
            this.alive = false;
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
}