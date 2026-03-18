# THIS FILE NEEDS TO BE UPDATED EVERY TIME AN ADDITION TO THE GAME IS MADE, DONT FORGET TO DO SO

## Update by Nathan - 18/03/2026 - 16:38

### Added : 
- A new part of the map, the street, accessible by walking out the door in the spawn appartment

### Modified : 
- The file structure of the game so we can actually see where everything is (in the code)
- I updated the look / graphisms of the game so we could see better 

### Fixed : 
- We couldnt go back to the room when we were out in the street, i fixed it by adding a second file called Game.html, a copy of the room (when you start the game, you're in the room but the file is index.html, when you go back home, it switches to Game.html)
- The changes we made to the game (killing kevin, picking up coins, ...) werent kept in memory so coming back to the room would revive kevin, ... its now fixed by keeping every change in memory (example at the start of world.js)
- when going back home, we would appear next to the bed, now we appear nex to the door.


## Update by Nathan - 18/03/2026 - 17:05

### Added : 
- A guy that sell cool water once per run