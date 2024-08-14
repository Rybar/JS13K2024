export default class Room {
    constructor(x, y, width, height, torches=[]) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.torches = torches;
        this.complete = false;
        this.fill = 2;
        this.completeColor = 2;
    }

    containsPlayer(player, tileSize) {
        //check if player is in the room
        if(player.x > this.x && player.x < this.x + this.width && player.y > this.y && player.y < this.y + this.height) {
            return true;
        }
        return false;
    }

    draw(r, view) {
        r.fRect(this.x - view.x, this.y - view.y, this.width, this.height, this.fill);
        //r.lRect(this.x - view.x, this.y - view.y, this.width, this.height, this.completeColor)

        this.torches.forEach(torch => {
            torch.draw(r, view);
        });
    }

    update(player) {
        let playerInRoom = this.containsPlayer(player, 8);
        
        
        for (let i = 0; i < this.torches.length; i++) {
            this.torches[i].update(player);
        }
        this.complete = this.torches.length > 0 && this.torches.every(torch => torch.lit);

        this.fill = playerInRoom ? 3 : 2;
        this.completeColor = this.complete ? 13 : 63;
    }
    
}