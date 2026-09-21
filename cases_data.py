CASES = [
    {
        "id": "Languages",
        "name": "Programming Language Case",
        "items": [
            {"name": "Python", "weight": 26},
            {"name": "C#", "weight": 26},
            {"name": "C++", "weight": 26},
            {"name": "Java", "weight": 12},
            {"name": "Go", "weight": 8},
            {"name": "New Language", "weight": 2},
        ],
    },
    {
        "id": "Dinner",
        "name": "What to Eat Case",
        "items": [
            {"name": "Pizza", "weight": 35},
            {"name": "Burger", "weight": 25},
            {"name": "Pasta", "weight": 18},
            {"name": "Salad", "weight": 12},
            {"name": "Fajitas", "weight": 7},
            {"name": "Sushi", "weight": 3},
        ],
    },
]


def get_case(case_id):
    return next((c for c in CASES if c["id"] == case_id), None)