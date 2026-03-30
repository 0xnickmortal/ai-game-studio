# PROTOTYPE - NOT FOR PRODUCTION
# Question: Does the collect-cook-fight loop feel fun?
# Date: 2026-03-29

class_name GameData

enum Element { FIRE, ICE, THUNDER, POISON, HEAL, EARTH }

const ELEMENT_COLORS = {
	0: Color(1.0, 0.3, 0.1),
	1: Color(0.3, 0.7, 1.0),
	2: Color(1.0, 1.0, 0.2),
	3: Color(0.6, 0.1, 0.8),
	4: Color(0.2, 1.0, 0.4),
	5: Color(0.5, 0.8, 0.2),
}

const ELEMENT_NAMES = {
	0: "Fire",
	1: "Ice",
	2: "Thunder",
	3: "Poison",
	4: "Heal",
	5: "Earth",
}

const ELEMENT_SYMBOLS = {
	0: "F",
	1: "I",
	2: "T",
	3: "P",
	4: "H",
	5: "E",
}

# Recipes: sorted ingredient pair -> dish data
# Key format: "ELEMENT_A+ELEMENT_B" (sorted by enum value)
const RECIPES = {
	"0+0": {"name": "Flame Burst Soup", "damage": 35, "effect": "burn", "color": Color(1.0, 0.4, 0.1)},
	"0+1": {"name": "Steam Sashimi", "damage": 25, "effect": "knockback", "color": Color(0.7, 0.5, 0.9)},
	"0+2": {"name": "Thunder Roast", "damage": 40, "effect": "chain", "color": Color(1.0, 0.7, 0.2)},
	"1+1": {"name": "Frozen Parfait", "damage": 20, "effect": "slow", "color": Color(0.4, 0.8, 1.0)},
	"1+5": {"name": "Moss Gelato", "damage": 22, "effect": "aoe_slow", "color": Color(0.3, 0.9, 0.6)},
	"2+2": {"name": "Ball Lightning Dumpling", "damage": 45, "effect": "chain", "color": Color(1.0, 1.0, 0.4)},
	"3+3": {"name": "Venom Broth", "damage": 30, "effect": "dot", "color": Color(0.7, 0.2, 0.9)},
	"3+5": {"name": "Toxic Mapo Tofu", "damage": 28, "effect": "poison_zone", "color": Color(0.5, 0.6, 0.2)},
	"4+4": {"name": "Holy Feast", "damage": 0, "effect": "heal", "color": Color(0.3, 1.0, 0.5)},
	"5+5": {"name": "Earthen Stew", "damage": 25, "effect": "aoe_slow", "color": Color(0.6, 0.7, 0.2)},
}

static func get_recipe_key(a: int, b: int) -> String:
	var low = mini(a, b)
	var high = maxi(a, b)
	return "%d+%d" % [low, high]

static func lookup_recipe(a: int, b: int) -> Dictionary:
	var key = get_recipe_key(a, b)
	if RECIPES.has(key):
		return RECIPES[key]
	return {"name": "Mystery Stew", "damage": 15, "effect": "none", "color": Color(0.7, 0.7, 0.7)}
