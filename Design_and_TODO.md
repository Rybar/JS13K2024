
## Working Title: Six and Seven
### Pitch: 
A dungeon inhabited with shadow demons inexplicably afraid of the number 13. Figure out how to open the exit on each floor while fighting off the shadow demons.

Main rooms will be numbered 1 thru 12. Exit room portal activated when torches on annointed altars total 13 or greater. Exactly 13 is better, fewer altars is better. 

Higher numbered rooms, while easier to activate, raise more alarm and difficulty.


TODO:
### player
- [x] has an attack verb that damages enemies.
- [x] action verb required to light torches
- [x] collision reworked/debugged
- [ ] can dodge
- [x] has max accelleration to limit enemy pushing
- [x] separate collision box for attack
- [ ] polish position of attack boxes
- [ ] flaming sword / torch -use pewpewquest sword logic
- [x] legs
- [x] direction facing tracked


### Enemies
- [x] move towards torches if lit, extinguish them on contact
- [x] move towards player if close enough
- [x] damage player if contact made with player
- [ ] increased spawn rate - from corners of rooms
- [ ] burst effect when spawning
- [ ] stay seperate from each other / dont clump together
- [x] drop gremlin blood when killed
- [x] uses player collision
- [ ] spider legs
- [ ] make combat more interesting
- [ ] telegraphs attack before attacking
- [ ] successful attack does a lot of damage to player
- [ ] brute gremlin type
- [ ] ignore torches once altar is annointed. get more aggressive towards player
- [ ] larger beefier gremlins when altar count is greater than 13
- [ ] bezerk / super aggressive gremlins if count is exactly 13


### Room / torch logic refinement
- [x] new object: altar. altar will have and track torches.
- [x] Altar has a minimum of 3 torches (triangle)
- [x] Once torches are lit, the altar must be annointed with gremlin blood in it's center
- [ ] altar center lines light up and torch flames change color when altar is annointed
- [ ]the more torches the altar has, the more blood is required to fully activate the altar.
- [ ] As more altars are lit, stronger gremlins are deployed to your position.
- [ ] altars with higher number of torch points attract more aggression.
- [ ] hitting 13 complete altar points triggers a ton of enemy spawns
- [ ] rooms spawn enemies in the corners

### feedback things
- [ ] burst at torch count when greater than 13
- [ ] big burst and sound when torch count hits exactly 13
- [ ] If perfect 13 is reached with just 2 altars, player firepower and speed is increased

### Map Generation
- [x] no connections too small for player to get through
- [x] fewer noise/garbage rooms kept
- [ ] border tiles
- [ ] floor guaranteed has 1 Six and 1 Seven point altar

### new object: Exit portal
- [x] activated when altars are complete that sum 13.
- [x] stand in its center to be evaporated to the next floor.


### general todos
- [ ] gamepad support
- [x] floor win condition, next floor generation
- [x] particles
- [x] dynamic lighting 
- [ ] game win state -something big for finishing floor 13

### sounds
- [ ] player attack - flame sword swoosh
- [ ] player hurt
- [ ] gremlin spawn
- [ ] gremlin hurt
- [ ] gremlin attack
- [ ] torch lit
- [ ] alter complete
- [ ] 


