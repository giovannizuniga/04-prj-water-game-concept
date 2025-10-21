# 04-prj-water-game-concept
# Charity: Water Truck Snake Game - Game Logic

1. Game Start:
	- When the game loads, the canvas, score counter, and feedback area are displayed.
	- The player’s truck appears at the starting position.
	- One water drop and one pollutant are placed randomly on the canvas.
	- The score is set to zero, and the jerry can trail is empty.
	- The player can choose game difficulty at the start screen (modes change the way points are tracked)

2. Player Actions:
	- The player uses arrow keys to move the truck up, down, left, or right.
	- The truck moves in the chosen direction at a set speed.
	- Directional buttons appear on smaller displays to allow for gameplay on mobile/tablets without keyboards
	- The player can click the “Restart” button to reset the game.

3. Game Logic:
	- The game checks for collisions:
	  - If the truck collects a water drop, the score increases, a jerry can is added to the trail, and a new drop appears.
	  - If the truck hits a pollutant, the game ends.
	  - If the truck hits the wall or its own jerry can trail, the game ends.
	- Milestones are triggered when the score reaches certain values (e.g., every 5 drops).

4. Score/Feedback:
	- The score counter updates each time a water drop is collected.
	- Feedback messages appear for collecting drops, hitting milestones, or encountering pollutants.
	- Visual feedback includes the growing jerry can trail and changing score.
	- Difficulties modes affect scoring and other mechanics of game. Medium makes increase pollutants spawns/point deductions. Hard mode increase truck speed

5. Win or Lose Conditions:
	- The game ends if the truck hits a wall, a pollutant, or its own trail.
	- When the game ends, a “Game Over” message and feedback are shown.
	- The player can see their final score.

6. Reset/Replay:
	- Clicking the “Restart” button resets the truck, score, jerry can trail, drops, and pollutants.
	- The game starts fresh, allowing the player to play again.