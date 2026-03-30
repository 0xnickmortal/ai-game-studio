# PROTOTYPE - NOT FOR PRODUCTION
extends CanvasLayer

signal choice_made(choice: Dictionary)

var choices: Array = []
var choice_buttons: Array = []
var panel: Panel

const UPGRADE_POOL = [
	{"name": "Fire Rate+", "desc": "Attack 20% faster", "stat": "fire_rate", "value": 0.8, "color": Color(1, 0.6, 0.2)},
	{"name": "Damage+", "desc": "+5 base damage", "stat": "damage", "value": 5, "color": Color(1, 0.3, 0.3)},
	{"name": "Speed+", "desc": "Move 15% faster", "stat": "speed", "value": 1.15, "color": Color(0.3, 0.8, 1)},
	{"name": "Magnet+", "desc": "Bigger pickup range", "stat": "magnet", "value": 30, "color": Color(0.4, 0.6, 1)},
	{"name": "Max HP+", "desc": "+25 max health", "stat": "max_hp", "value": 25, "color": Color(0.2, 0.9, 0.3)},
	{"name": "Backpack+", "desc": "+2 ingredient slots", "stat": "backpack", "value": 2, "color": Color(0.8, 0.7, 0.2)},
	{"name": "Dodge+", "desc": "Dodge cools down faster", "stat": "dodge_cd", "value": 0.8, "color": Color(0.5, 0.8, 1)},
	{"name": "Proj Speed+", "desc": "Projectiles 25% faster", "stat": "proj_speed", "value": 1.25, "color": Color(0.9, 0.9, 0.4)},
]

func _ready() -> void:
	visible = false
	process_mode = Node.PROCESS_MODE_ALWAYS

	panel = Panel.new()
	panel.position = Vector2(180, 120)
	panel.size = Vector2(600, 300)
	add_child(panel)

	var title = Label.new()
	title.text = "LEVEL UP! Choose an upgrade:"
	title.position = Vector2(30, 15)
	title.add_theme_font_size_override("font_size", 20)
	title.add_theme_color_override("font_color", Color(1, 0.9, 0.3))
	panel.add_child(title)

func show_choices() -> void:
	# Pick 3 random unique upgrades
	var pool = UPGRADE_POOL.duplicate()
	choices.clear()
	for b in choice_buttons:
		if is_instance_valid(b):
			b.queue_free()
	choice_buttons.clear()

	for i in 3:
		if pool.size() == 0:
			break
		var idx = randi() % pool.size()
		choices.append(pool[idx])
		pool.remove_at(idx)

	for i in choices.size():
		var c = choices[i]
		var btn = Button.new()
		btn.position = Vector2(30 + i * 190, 60)
		btn.size = Vector2(170, 210)
		btn.text = c.name + "\n\n" + c.desc
		btn.add_theme_font_size_override("font_size", 14)
		btn.pressed.connect(_on_pick.bind(i))
		panel.add_child(btn)
		choice_buttons.append(btn)

	visible = true
	get_tree().paused = true

func _on_pick(index: int) -> void:
	if index >= choices.size():
		return
	visible = false
	get_tree().paused = false
	choice_made.emit(choices[index])

var e_was_pressed: bool = false
func _process(_delta: float) -> void:
	if not visible:
		return
	# Quick pick with 1/2/3 keys
	if Input.is_key_pressed(KEY_1) and choices.size() >= 1:
		_on_pick(0)
	elif Input.is_key_pressed(KEY_2) and choices.size() >= 2:
		_on_pick(1)
	elif Input.is_key_pressed(KEY_3) and choices.size() >= 3:
		_on_pick(2)
