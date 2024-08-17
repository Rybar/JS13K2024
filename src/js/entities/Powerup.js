export default class Powerup {

    

    constructor(type, x, y){

        this.types = {
            HEALTH: {
                life: 5000,
                color: 5,
                effect : function (player) {
                    player.health = Math.min(player.health + 1, player.maxHealth);
                }
            },
            GREMLIN_BLOOD: {
                life: 5000,
                color: 11,
                effect : function (player) {
                    player.gremlinBlood += 1;
                }   
            }
        }

        this.x = x;
        this.y = y;
        this.alive = true;
        
        this.type = this.types[type];
        this.life = type.life
        this.lifeMax = this.life;
        this.color = this.type.color;
        this.effect = this.type.effect;
    }

    update(){
        if (!this.alive) return;
        this.life--;
        if(this.life <= 0){
            this.alive = false;
        }        
        //distance to player
        const distanceToPlayer = Math.hypot(this.x - player.x, this.y - player.y);
        if(distanceToPlayer < 8){
            this.effect(player);
            this.alive = false;
        }
    }

    draw(r, view){
        r.renderTarget = r.SCREEN;
        r.fRect(this.x - view.x, this.y - view.y, 4, 4, this.color);
    }



}