# Tic-Tac-Toe Circus - Human vs Machine Showdown

Step right up and test your intellect in this vibrant, carnival-themed **Tic-Tac-Toe Circus**! The game features **Adversarial Search** using the **Minimax Algorithm** running on a Python Flask backend. The client interface is a responsive, high-energy arcade panel featuring CSS stripes, hanging lights, floating balloons, marquee signboard status indicators, and Web Audio synthesizers playing pop/whistle game sounds.

---

## Features

- **Vibrant Circus Theme**: Playful striped backgrounds, scallop banners, bulbs, and floating balloon/ticket animations.
- **Multiple Show Modes**:
  - **Human vs AI**: Challenge the Minimax agent on Easy, Medium, Hard, or Impossible difficulties.
  - **Human vs Human**: Share the device with a friend for offline local play.
  - **AI vs AI (Spectator Mode)**: Watch X and O agents play each other automatically, featuring pause/resume and speed controls.
- **Symbol Selection**: Choose to play as X or O. If you choose O, the AI plays X and takes the first move automatically.
- **Arcade Scoreboard**: Persists score counters (Player 1, Player 2, and Draws) locally in the browser.
- **Information Booth AI Analysis**: Displays real-time Minimax statistics computed by the server (depth, possible moves, evaluations).
- **CSS Confetti Shower**: Confetti bursts rotate and float down the screen celebrating victories and draws.
- **Web Audio Sound Effects**: Zero-latency pop beeps, rising bubble clicks, sliding whistle draws, and triumph fanfare chords synthesized dynamically.

---

## Project Structure

```text
tic-tac-toe-circus/
│
├── app.py              # Flask server routes and Minimax search
├── requirements.txt    # Python micro-dependencies
├── README.md           # Documentation
│
├── templates/
│   └── index.html      # Responsive single-page layout
│
├── static/
│   ├── css/
│   │   └── style.css   # Stripes, canopies, marquees, 3D button animations
│   │
│   └── js/
│       └── script.js   # Confetti particle engine, beeps & whistles synth, routing
│
└── tests/
    └── test_game.py    # Unit tests for endpoints and minimax actions
```

---

## Adversarial Search Theory

### Minimax Algorithm
Minimax is a zero-sum decision-making search.
- **MAX (AI)**: Aims to find the move resulting in the highest terminal score (`10 - depth`).
- **MIN (Human)**: Assumed to play rationally to minimize the AI's utility, reducing scores to (`depth - 10`).

### Depth Penalties
- **AI Wins**: `10 - depth` (AI plays the fastest winning move).
- **AI Losses**: `depth - 10` (AI delays human victories if defeat is inevitable).
- **Draw**: `0`

---

## API Endpoints

All backend endpoints are stateless:

### 1. `GET /`
Serves the single-page carnival web application.

### 2. `POST /api/validate`
Validates general board validity: X always plays first, and turns must alternate (`0 <= count("X") - count("O") <= 1`).

### 3. `POST /api/move`
Enforces strict turn validation and runs Minimax to compute the next move.
- **Payload**:
  ```json
  {
      "board": ["X", "", "", "", "", "", "", "", ""],
      "player_symbol": "X",
      "ai_symbol": "O",
      "difficulty": "impossible"
  }
  ```
- **Returns**:
  ```json
  {
      "move": 4,
      "board": ["X", "", "", "", "O", "", "", "", ""],
      "status": "playing",
      "explanation": {
          "algorithm": "Minimax",
          "search_type": "Adversarial Search",
          "depth": 8,
          "possible_moves": 8,
          "best_move": "Center",
          "evaluation": "0 (Balanced / Draw)"
      }
  }
  ```

### 4. `POST /api/reset`
Resets the board state.

---

## Installation & Setup

1. **Activate virtual environment**:
   * **Windows**:
     ```bash
     python -m venv venv
     venv\Scripts\activate
     ```
   * **macOS/Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Run Flask Server**:
   ```bash
   python app.py
   ```
4. Access `http://127.0.0.1:5000` in your web browser.

---

## Testing

Run the automated test suite directly:
```bash
python tests/test_game.py
```
# 🎪 Tic-Tac-Toe AI Carnival

> **Where Human Brains Meet Machine Intelligence**

🔗 **Live Demo:**  
https://92460118765-tic-tac-toe-ai-carnival.vercel.app/

---

## 🎮 Game Modes

- 🎩 Human vs AI
- 👥 Human vs Human
- 🤖 AI vs AI

## 🧠 AI

- Adversarial Search
- Minimax Algorithm
- Multiple Difficulty Levels
- AI Move Evaluation

## 🎪 Features

- 🌈 Vibrant Carnival UI
- 🎉 Confetti & Animations
- ❌ X / ⭕ O Selection
- 🏆 Score Tracking
- ⚙️ Settings
- 🔊 Sound Controls
- 📱 Responsive Design

---

## 🎯 Play Now

### 🎟️ Enter the Carnival

**[Play Tic-Tac-Toe AI](https://92460118765-tic-tac-toe-ai-carnival.vercel.app/)**

---

### 👨‍💻 Author

**Abhishek Daramoni**
