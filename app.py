import os
import random
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Winning combinations on a 3x3 Tic-Tac-Toe board
WIN_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],  # Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8],  # Columns
    [0, 4, 8], [2, 4, 6]              # Diagonals
]

# Position name mappings for the carnival booth info board
POSITION_NAMES = [
    "Top-Left", "Top-Center", "Top-Right",
    "Middle-Left", "Center", "Middle-Right",
    "Bottom-Left", "Bottom-Center", "Bottom-Right"
]

def check_winner(board):
    """
    Checks if there is a winner on the board.
    Returns 'X', 'O', or None.
    """
    for combo in WIN_COMBINATIONS:
        if board[combo[0]] == board[combo[1]] == board[combo[2]] != "":
            return board[combo[0]]
    return None

def is_board_full(board):
    """
    Checks if the board is completely full (no empty cells).
    """
    return all(cell != "" for cell in board)

def get_available_moves(board):
    """
    Returns a list of indices representing available (empty) spaces.
    """
    return [i for i, cell in enumerate(board) if cell == ""]

def minimax(board, depth, is_maximizing, ai_symbol, player_symbol):
    """
    Adversarial Search using Minimax algorithm.
    ai_symbol is the maximizing player.
    player_symbol is the minimizing player.
    """
    winner = check_winner(board)
    if winner == ai_symbol:
        return 10 - depth
    elif winner == player_symbol:
        return depth - 10
    elif is_board_full(board):
        return 0

    if is_maximizing:
        best_score = -float('inf')
        for move in get_available_moves(board):
            board[move] = ai_symbol
            score = minimax(board, depth + 1, False, ai_symbol, player_symbol)
            board[move] = ""
            best_score = max(best_score, score)
        return best_score
    else:
        best_score = float('inf')
        for move in get_available_moves(board):
            board[move] = player_symbol
            score = minimax(board, depth + 1, True, ai_symbol, player_symbol)
            board[move] = ""
            best_score = min(best_score, score)
        return best_score

def get_best_move(board, ai_symbol, player_symbol):
    """
    Returns (best_move, best_score) for the AI.
    """
    best_score = -float('inf')
    best_move = None
    available = get_available_moves(board)
    if not available:
        return None, 0

    for move in available:
        board[move] = ai_symbol
        score = minimax(board, 1, False, ai_symbol, player_symbol)
        board[move] = ""
        if score > best_score:
            best_score = score
            best_move = move
    return best_move, best_score

def validate_board_state(board, player_symbol, ai_symbol, is_ai_turn=False):
    """
    Syntactic and semantic validation of the board.
    """
    if not isinstance(board, list):
        return False, "Board must be a list."
    if len(board) != 9:
        return False, "Board must have exactly 9 elements."
    if player_symbol not in ["X", "O"] or ai_symbol not in ["X", "O"] or player_symbol == ai_symbol:
        return False, "Invalid player/AI symbol configurations."

    # Validate cell values
    for i, cell in enumerate(board):
        if cell not in ["", "X", "O"]:
            return False, f"Invalid value '{cell}' at cell index {i}. Must be 'X', 'O', or ''."

    x_count = board.count("X")
    o_count = board.count("O")

    # X always plays first
    if not (0 <= x_count - o_count <= 1):
        return False, f"Invalid game state. X must play first and turns must alternate. Found X: {x_count}, O: {o_count}."

    # Specific turn verification when requesting an AI move
    if is_ai_turn:
        if ai_symbol == "X":
            if x_count != o_count:
                return False, f"Invalid turn sequence. AI is X and plays first. Found X: {x_count}, O: {o_count}. It is X's turn, so count must be equal."
        else: # ai_symbol == "O"
            if x_count != o_count + 1:
                return False, f"Invalid turn sequence. Player is X and plays first. Found X: {x_count}, O: {o_count}. It is O's turn, so X count must be O count + 1."

    return True, ""

@app.route("/")
def index():
    """
    Serve main single-page dashboard.
    """
    return render_template("index.html")

@app.route("/api/validate", methods=["POST"])
def api_validate():
    """
    API endpoint to check if a board configuration is logically and syntax-wise valid.
    """
    data = request.get_json(silent=True)
    if not data or "board" not in data or "player_symbol" not in data or "ai_symbol" not in data:
        return jsonify({"valid": False, "error": "Missing elements in request body."}), 400

    board = data["board"]
    player_symbol = data["player_symbol"]
    ai_symbol = data["ai_symbol"]

    is_valid, err_msg = validate_board_state(board, player_symbol, ai_symbol)
    if not is_valid:
        return jsonify({"valid": False, "error": err_msg}), 400

    return jsonify({"valid": True})

@app.route("/api/move", methods=["POST"])
def api_move():
    """
    Post a move calculation. Returns chosen cell index and an explanation model.
    """
    data = request.get_json(silent=True)
    if not data or "board" not in data or "player_symbol" not in data or "ai_symbol" not in data:
        return jsonify({"error": "Missing data. Board, player_symbol, and ai_symbol are required."}), 400

    board = data["board"]
    player_symbol = data["player_symbol"]
    ai_symbol = data["ai_symbol"]
    difficulty = data.get("difficulty", "impossible").lower()

    # Validate
    is_valid, err_msg = validate_board_state(board, player_symbol, ai_symbol, is_ai_turn=True)
    if not is_valid:
        return jsonify({"error": err_msg}), 400

    # Ensure game is not already won or full
    if check_winner(board) is not None or is_board_full(board):
        return jsonify({"error": "Game is already finished. Cannot calculate next move."}), 400

    available = get_available_moves(board)
    if not available:
        return jsonify({"error": "No available moves."}), 400

    # Calculate optimal move using Minimax
    best_move, best_score = get_best_move(board, ai_symbol, player_symbol)

    # Apply difficulty probability offsets
    chosen_move = best_move
    is_random_choice = False

    if difficulty == "easy":
        if random.random() > 0.20:
            chosen_move = random.choice(available)
            is_random_choice = True
    elif difficulty == "medium":
        if random.random() > 0.50:
            chosen_move = random.choice(available)
            is_random_choice = True
    elif difficulty == "hard":
        if random.random() > 0.85:
            chosen_move = random.choice(available)
            is_random_choice = True

    # If random move was picked, evaluate its specific score for the explanation block
    if is_random_choice and chosen_move != best_move:
        board[chosen_move] = ai_symbol
        best_score = minimax(board, 1, False, ai_symbol, player_symbol)
        board[chosen_move] = ""

    # Apply move
    board[chosen_move] = ai_symbol

    # Format evaluation string
    eval_str = f"{best_score:+d}" if best_score != 0 else "0"
    if best_score > 0:
        eval_str += " (AI Advantage)"
    elif best_score < 0:
        eval_str += " (Human Advantage)"
    else:
        eval_str += " (Balanced / Draw)"

    # Determine status
    winner = check_winner(board)
    if winner == ai_symbol:
        status = "win_O" if ai_symbol == "O" else "win_X"
    elif winner == player_symbol:
        status = "win_X" if player_symbol == "X" else "win_O"
    elif is_board_full(board):
        status = "draw"
    else:
        status = "playing"

    explanation = {
        "algorithm": "Minimax with Random Fallback" if is_random_choice else "Minimax",
        "search_type": "Random Selection" if is_random_choice else "Adversarial Search",
        "depth": 1 if is_random_choice else (9 - len(available) + 1),
        "possible_moves": len(available),
        "best_move": POSITION_NAMES[chosen_move],
        "evaluation": eval_str
    }

    return jsonify({
        "move": chosen_move,
        "board": board,
        "status": status,
        "explanation": explanation
    })

@app.route("/api/reset", methods=["POST"])
def api_reset():
    """
    Returns an empty board.
    """
    return jsonify({
        "board": [""] * 9,
        "status": "playing"
    })

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
