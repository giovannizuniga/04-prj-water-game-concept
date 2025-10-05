# 💧 Water Collection Game

A fun, fast-paced snake-style game to promote charity: water's mission to bring clean water to people in need.

## Game Overview

Navigate a small truck across the screen, collecting blue water drops while avoiding brown pollutants. Each water drop you collect adds a signature yellow jerry can to your trail, visually representing the impact you're making!

## Features

- **Snake-style Gameplay**: Move the truck with arrow keys to collect water drops
- **Jerry Can Trail**: Each collected water drop adds a yellow jerry can behind your truck (inspired by charity:water's signature yellow containers)
- **Score Counter**: Track your progress in real-time
- **Feedback Messages**: Get instant feedback when collecting drops or hitting obstacles
- **Milestone System**: Unlock encouraging messages as you reach score milestones:
  - 5 drops: "Great start! Keep going! 🌊"
  - 10 drops: "You're making a difference! 💧"
  - 20 drops: "Amazing work! 🎉"
  - 30 drops: "Water hero! 🏆"
  - 50 drops: "Incredible! You're unstoppable! 🌟"
- **Dynamic Difficulty**: Game speed increases as you score more points
- **Game Over Screen**: See your final score and a personalized message

## How to Play

1. Open `index.html` in a web browser
2. Click "Start Game"
3. Use **Arrow Keys** to move the truck:
   - ⬆️ Up Arrow - Move up
   - ⬇️ Down Arrow - Move down
   - ⬅️ Left Arrow - Move left
   - ➡️ Right Arrow - Move right
4. Collect blue water drops 💧 to increase your score
5. Avoid brown pollutants ❌ - hitting them ends the game
6. Watch your yellow jerry can trail grow with each drop collected!

## Technologies Used

- HTML5 Canvas for game rendering
- CSS3 for styling and animations
- Vanilla JavaScript for game logic
- No external dependencies required!

## Screenshots

### Game Start
![Initial State](https://github.com/user-attachments/assets/964a3368-680d-43af-b177-44699c2a06a8)

### Active Gameplay with Jerry Can Trail
![Gameplay with Trail](https://github.com/user-attachments/assets/53c61818-f19f-46a0-8cb3-7b2b0ea85824)

### Game Over Screen
![Game Over](https://github.com/user-attachments/assets/8cc28699-edb5-4106-9370-8ea9c77283e8)

## About charity: water

This game is inspired by [charity: water](https://www.charitywater.org/), a non-profit organization bringing clean and safe drinking water to people in developing countries. The yellow jerry cans in the game represent the containers many people use to transport clean water back to their homes.

## Running the Game

Simply open `index.html` in any modern web browser. No build process or server required!

For development:
```bash
# Optional: Run a local server
python3 -m http.server 8000
# Then open http://localhost:8000/index.html
```

## License

This project is open source and available for educational purposes.