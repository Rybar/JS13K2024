export default class Torch {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 3;
        this.lit = false;
        this.fill=2;
    }

    draw(r, view) {
        //console.log('Torch draw');
        r.renderTarget = r.SCREEN;
        r.fCircle(this.x - view.x, this.y - view.y, this.size, this.fill);
    }

    update() {
        this.fill = this.lit ? 6 : 63;
        //check for overlap with player. If so, light the torch.
        //will require action to light the torch in the future
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < 20 && player.isFiring) {
            this.lit = true;
        }
    }
}