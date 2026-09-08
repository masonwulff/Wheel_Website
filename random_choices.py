import random

user_choices = input("Enter your choices (comma-separated): ")
choices = [choice.strip() for choice in user_choices.split(',')]

user_weights = input("Enter the weights for your choices (comma-separated): ")

if user_weights.strip():
    weights = [int(weight.strip()) for weight in user_weights.split(',')]
else:
    weights = [1] * len(choices)

choice = random.choices(choices, weights=weights, k=1)[0]
print(f"The randomly selected choice is: {choice}")