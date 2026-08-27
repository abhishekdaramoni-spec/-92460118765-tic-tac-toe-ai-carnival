import unittest
import json
import sys
import os

# Add parent path to search path to import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, check_winner, is_board_full, get_best_move

class TestTicTacToeCircus(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

    def test_winner_detection(self):
        # Rows
        self.assertEqual(check_winner(["X", "X", "X", "", "", "", "", "", ""]), "X")
        self.assertEqual(check_winner(["", "", "", "O", "O", "O", "", "", ""]), "O")
        # Columns
        self.assertEqual(check_winner(["X", "", "", "X", "", "", "X", "", ""]), "X")
        # Diagonals
        self.assertEqual(check_winner(["O", "", "", "", "O", "", "", "", "O"]), "O")
        # No winner
        self.assertIsNone(check_winner(["X", "O", "X", "X", "O", "O", "O", "X", "X"]))

    def test_draw_detection(self):
        # Full board, no winner
        draw_board = ["X", "O", "X", "X", "O", "O", "O", "X", "X"]
        self.assertTrue(is_board_full(draw_board))
        self.assertIsNone(check_winner(draw_board))

        # Not full board
        active_board = ["X", "O", "", "X", "O", "O", "O", "X", "X"]
        self.assertFalse(is_board_full(active_board))

    def test_api_reset(self):
        response = self.client.post('/api/reset')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["board"], [""] * 9)
        self.assertEqual(data["status"], "playing")

    def test_api_validate(self):
        # Valid cases
        # 1. Start of game (empty board is valid)
        payload = {"board": [""] * 9, "player_symbol": "X", "ai_symbol": "O"}
        response = self.client.post('/api/validate', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(json.loads(response.data)["valid"])

        # 2. Ongoing game, human X is active, so X has played.
        payload = {"board": ["X", "", "", "", "", "", "", "", ""], "player_symbol": "X", "ai_symbol": "O"}
        response = self.client.post('/api/validate', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        # Invalid cases
        # 1. Invalid cell values
        payload = {"board": ["X", "O", "Z", "", "", "", "", "", ""], "player_symbol": "X", "ai_symbol": "O"}
        response = self.client.post('/api/validate', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(json.loads(response.data)["valid"])

        # 2. Invalid length
        payload = {"board": [""] * 8, "player_symbol": "X", "ai_symbol": "O"}
        response = self.client.post('/api/validate', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 400)

    def test_ai_blocks_horizontal(self):
        # Human X has 0, 1. AI O must block at 2.
        # Human plays first as X, so X count is 2, O count is 1. (Valid AI turn).
        board = ["X", "X", "", "O", "", "", "", "", ""]
        payload = {
            "board": board,
            "ai_symbol": "O",
            "player_symbol": "X",
            "difficulty": "impossible"
        }
        response = self.client.post('/api/move', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["move"], 2)
        self.assertEqual(data["board"][2], "O")

    def test_ai_wins_horizontal(self):
        # AI O has 3, 4. AI O must win at 5.
        # Human plays X (at 0, 1, 8). AI plays O.
        # Board:
        # X | X | -
        # O | O | -
        # - | - | X
        # X count = 3, O count = 2.
        board = ["X", "X", "", "O", "O", "", "", "", "X"]
        payload = {
            "board": board,
            "ai_symbol": "O",
            "player_symbol": "X",
            "difficulty": "impossible"
        }
        response = self.client.post('/api/move', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["move"], 5)
        self.assertEqual(data["status"], "win_O")

    def test_game_over_prevention(self):
        # Game already won by X. Requesting AI move should return 400.
        board = ["X", "X", "X", "O", "O", "", "", "", ""]
        payload = {
            "board": board,
            "ai_symbol": "O",
            "player_symbol": "X",
            "difficulty": "impossible"
        }
        response = self.client.post('/api/move', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", json.loads(response.data))

if __name__ == '__main__':
    unittest.main()
