export default class Torch {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 5;
        this.lit = false;
        this.fill=2;
    }

    draw(r, view) {
        //console.log('Torch draw');
        r.renderTarget = r.SCREEN;
        r.fCircle(this.x*8 - view.x, this.y*8 - view.y, this.size, this.fill);
    }

    update(player) {
        this.fill = this.lit ? 6 : 63;
        //check for overlap with player. If so, light the torch.
        //will require action to light the torch in the future
        let dx = player.x - this.x*8;
        let dy = player.y - this.y*8;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < 20) {
            this.lit = true;
        }
    }
}