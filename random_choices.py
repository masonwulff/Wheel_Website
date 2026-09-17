import random

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/spin", methods=["POST"])
def spin():
    """Pick a winner using the same weighted-random logic as the CLI version.

    The frontend sends the current choices/weights, we do the actual
    random selection here (server-side), and hand back just the index
    of the winner. The browser's job is only to animate the wheel
    landing on that index -- it never decides who wins.
    """
    data = request.get_json(force=True) or {}
    choices = data.get("choices", [])
    weights = data.get("weights", [])

    if not choices:
        return jsonify({"error": "No choices provided"}), 400

    if not weights or len(weights) != len(choices):
        weights = [1] * len(choices)

    # Guard against non-positive weights breaking random.choices
    weights = [w if isinstance(w, (int, float)) and w > 0 else 1 for w in weights]

    winner_index = random.choices(range(len(choices)), weights=weights, k=1)[0]

    return jsonify({"index": winner_index, "choice": choices[winner_index]})


if __name__ == "__main__":
    app.run(debug=True)