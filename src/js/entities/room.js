export default class Room {
    constructor(x, y, width, height, torches=[]) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.altar = null;
        this.complete = false;
        this.fill = 2;
        this.completeColor = 7;
    }

    containsPlayer(player, tileSize) {
        //check if player is in the room
        if(player.x / tileSize > this.x
            && player.x / tileSize < this.x + this.width
            && player.y / tileSize > this.y
            && player.y / tileSize < this.y + this.height) {
            return true;
        }
        return false;
    }

    draw(r, view) {
        r.fRect(this.x - view.x, this.y - view.y, this.width, this.height, this.fill);
        //r.lRect(this.x - view.x, this.y - view.y, this.width, this.height, this.completeColor)
        
    }

    drawAltar(r, view) {
        if(this.altar) {
            this.altar.draw(r, view);
        }
    }   

    update(player) {
        let playerInRoom = this.containsPlayer(player, 8);
        
        
        if(this.altar) {
            this.altar.update(player);
        }
        this.complete = this.altar && this.altar.annointed;

        this.fill = playerInRoom ? 4 : 2;
        this.fill = this.complete ? 5 : this.fill;
        
    }
    
}