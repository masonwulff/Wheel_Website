import random

from flask import Flask, abort, jsonify, render_template, request

from cases_data import CASES, get_case
from tiers import assign_tiers

app = Flask(__name__)


@app.route("/")
def cases_page():
    cases_with_tiers = [
        {**case, "items": assign_tiers(case["items"])} for case in CASES
    ]
    return render_template("cases.html", cases=cases_with_tiers, active_page="cases")


@app.route("/case/<case_id>")
def items_page(case_id):
    case = get_case(case_id)
    if not case:
        abort(404)
    items = assign_tiers(case["items"])
    return render_template(
        "items.html", case=case, items=items, active_page="cases"
    )


@app.route("/case/<case_id>/open")
def open_page(case_id):
    case = get_case(case_id)
    if not case:
        abort(404)
    items = assign_tiers(case["items"])
    return render_template(
        "open.html", case=case, items=items, active_page="cases"
    )


@app.route("/custom")
def custom_page():
    return render_template("custom.html", active_page="custom")


@app.route("/api/spin", methods=["POST"])
def spin():
    """Pick a winner via weighted random choice. Used by every case --
    premade or custom -- so there's exactly one place that decides
    who wins.
    """
    data = request.get_json(force=True) or {}
    choices = data.get("choices", [])
    weights = data.get("weights", [])

    if not choices:
        return jsonify({"error": "No choices provided"}), 400

    if not weights or len(weights) != len(choices):
        weights = [1] * len(choices)

    weights = [w if isinstance(w, (int, float)) and w > 0 else 1 for w in weights]

    winner_index = random.choices(range(len(choices)), weights=weights, k=1)[0]

    return jsonify({"index": winner_index, "choice": choices[winner_index]})


if __name__ == "__main__":
    app.run(debug=True)