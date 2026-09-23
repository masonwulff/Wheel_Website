CASES = [
    {
        "id": "Languages",
        "name": "Programming Language Case",
        "items": [
            {"name": "Python", "weight": 26, "icon": "🐍"},
            {"name": "C#", "weight": 26, "icon": "♯"},
            {"name": "C++", "weight": 26, "icon": "++"},
            {"name": "Java", "weight": 12, "icon": "☕"},
            {"name": "Go", "weight": 8, "icon": "→"},
            {"name": "New Language", "weight": 2, "icon": "✨"},
        ],
    },
    {
        "id": "Dinner",
        "name": "What to Eat Case",
        "items": [
            {"name": "Pizza", "weight": 35, "icon": "🍕"},
            {"name": "Burger", "weight": 25, "icon": "🍔"},
            {"name": "Pasta", "weight": 18, "icon": "🍝"},
            {"name": "Salad", "weight": 12, "icon": "🥗"},
            {"name": "Fajitas", "weight": 7, "icon": "🌯"},
            {"name": "Sushi", "weight": 3, "icon": "🍣"},
        ],
    },
]


def get_case(case_id):
    return next((c for c in CASES if c["id"] == case_id), None)