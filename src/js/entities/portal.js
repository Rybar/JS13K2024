export default class Portal {
    constructor(x, y) {
        this.x = x*8;
        this.y = y*8;
        this.size = 20;
        this.fill = 39;
        this.active = false;
    }

    draw(r, view) {
        r.renderTarget = r.SCREEN;
        r.fCircle(this.x - view.x, this.y - view.y, this.size, this.fill);
    }

    update(player) {
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 20 && player.currentRoom.complete) {
            this.active = true;
            
        }
    }
}