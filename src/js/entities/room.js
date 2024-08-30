export default class Room {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.portal = null;
        this.altar = null;
        this.complete = false;
        this.fill = 2;
        this.completeColor = 7;
    }

    containsPlayer(P, tileSize) {
        //check if P is in the room
        if(P.x / tileSize > this.x
            && P.x / tileSize < this.x + this.width
            && P.y / tileSize > this.y
            && P.y / tileSize < this.y + this.height) {
            return true;
        }
        return false;
    }

    draw(r, view) {
        r._fRect(this.x - view.x, this.y - view.y, this.width, this.height, this.fill);
        //r.lRect(this.x - view.x, this.y - view.y, this.width, this.height, this.completeColor)
        
    }

    drawAltar(r, view) {
        if(this.altar) {
            this.altar.draw(r, view);
        }
        if(this.portal) {
            this.portal.draw(r, view);
        }
        
    }   

    update(P) {
        let playerInRoom = this.containsPlayer(P, tileSize);
        P.currentRoom = playerInRoom ? this : P.currentRoom;
        
        if(this.altar) {
            this.altar.update(P);
        }
        this.complete = this.altar && this.altar.annointed;

        if(this.portal) {
            this.portal.update(P);
        }
        this.fill = playerInRoom ? 4 : 2;
        this.fill = this.complete ? 5 : this.fill;
        
    }
    
}