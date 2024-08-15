
## Working Title: Six and Seven
### Pitch: 
A dungeon inhabited with shadow demons inexplicably afraid of the number 13. Figure out how to open the exit on each floor while fighting off the shadow demons.

Main rooms will be numbered 1 thru 12. Exit room will be numbered 1 thru 12. Activating rooms raised the number shown in the exit room. You must activate rooms to bring the exit room number up to 13.

Higher numbered rooms, while easier to activate, raise more alarm and difficulty.


TODO:
### player
- [x] has an attack verb that damages enemies.
- [x] action verb required to light torches
- [x] collision reworked/debugged
- [ ] can dodge 

### Enemies
- [x] move towards torches if lit, extinguish them on contact
- [x] move towards player if close enough
- [x] damage player if contact made with player
- [ ] stay seperate from each other / dont clump together
- [x] drop gremlin blood when killed
- [x] uses player collision
- [ ] telegraphs attack before attacking
- [ ] brute gremlin type

### Room / torch logic refinement
- [x] new object: altar. altar will have and track torches.
- [x] Altar has a minimum of 3 torches (triangle)
- [x] Once torches are lit, the altar must be annointed with gremlin blood in it's center
- [ ]the more torches the altar has, the more blood is required to fully activate the altar.
- [ ] As more altars are lit, stronger gremlins are deployed to your position.
- [ ] altars with higher number of torch points attract more aggression.
- [ ] hitting 13 complete altar points triggers a ton of enemy spawns

### Map Generation
- [x] no connections too small for player to get through
- [ ] fewer noise/garbage rooms kept

### new object: Exit portal
- [ ] activated when altars are complete that sum 13.
- [ ] stand in its center to be evaporated to the next floor.


### general todos
- [ ] gamepad support
- [ ] floor win condition, next floor generation
- [ ] particles


