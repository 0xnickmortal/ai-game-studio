# PROTOTYPE - NOT FOR PRODUCTION
extends CanvasLayer

var hp_fill: ColorRect
var hp_label: Label
var xp_fill: ColorRect
var xp_label: Label
var backpack_container: HBoxContainer
var equip_container: HBoxContainer
var kill_label: Label
var timer_label: Label
var hint_label: Label
var level_label: Label

var kills: int = 0
var equip_labels: Array = []

func _ready() -> void:
	# Top bar
	var top_bg = ColorRect.new()
	top_bg.position = Vector2(0, 0)
	top_bg.size = Vector2(960, 50)
	top_bg.color = Color(0.04, 0.04, 0.07, 0.85)
	add_child(top_bg)

	# HP bar
	var hp_bg = ColorRect.new()
	hp_bg.position = Vector2(10, 6)
	hp_bg.size = Vector2(140, 14)
	hp_bg.color = Color(0.15, 0.05, 0.05)
	add_child(hp_bg)

	hp_fill = ColorRect.new()
	hp_fill.position = Vector2(11, 7)
	hp_fill.size = Vector2(138, 12)
	hp_fill.color = Color(0.2, 0.8, 0.3)
	add_child(hp_fill)

	hp_label = Label.new()
	hp_label.position = Vector2(35, 3)
	hp_label.add_theme_font_size_override("font_size", 11)
	hp_label.add_theme_color_override("font_color", Color.WHITE)
	add_child(hp_label)

	# XP bar (below HP)
	var xp_bg = ColorRect.new()
	xp_bg.position = Vector2(10, 24)
	xp_bg.size = Vector2(140, 8)
	xp_bg.color = Color(0.05, 0.05, 0.15)
	add_child(xp_bg)

	xp_fill = ColorRect.new()
	xp_fill.position = Vector2(11, 25)
	xp_fill.size = Vector2(0, 6)
	xp_fill.color = Color(0.3, 0.5, 1.0)
	add_child(xp_fill)

	level_label = Label.new()
	level_label.position = Vector2(10, 33)
	level_label.add_theme_font_size_override("font_size", 10)
	level_label.add_theme_color_override("font_color", Color(0.5, 0.7, 1.0))
	level_label.text = "Lv.1"
	add_child(level_label)

	# Backpack
	var bp_title = Label.new()
	bp_title.text = "Bag:"
	bp_title.position = Vector2(170, 4)
	bp_title.add_theme_font_size_override("font_size", 11)
	bp_title.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6))
	add_child(bp_title)

	backpack_container = HBoxContainer.new()
	backpack_container.position = Vector2(205, 2)
	add_child(backpack_container)

	# Equipment
	var eq_title = Label.new()
	eq_title.text = "Dishes:"
	eq_title.position = Vector2(170, 22)
	eq_title.add_theme_font_size_override("font_size", 10)
	eq_title.add_theme_color_override("font_color", Color(1, 0.85, 0.3))
	add_child(eq_title)

	equip_container = HBoxContainer.new()
	equip_container.position = Vector2(225, 20)
	add_child(equip_container)

	for i in 4:
		var lbl = Label.new()
		lbl.text = "[--]"
		lbl.add_theme_font_size_override("font_size", 10)
		lbl.add_theme_color_override("font_color", Color(0.4, 0.4, 0.4))
		equip_container.add_child(lbl)
		equip_labels.append(lbl)

	# Timer (top center)
	timer_label = Label.new()
	timer_label.position = Vector2(440, 6)
	timer_label.add_theme_font_size_override("font_size", 18)
	timer_label.add_theme_color_override("font_color", Color(0.8, 0.8, 0.9))
	timer_label.text = "0:00"
	add_child(timer_label)

	# Kill counter (top right)
	kill_label = Label.new()
	kill_label.position = Vector2(880, 6)
	kill_label.add_theme_font_size_override("font_size", 14)
	kill_label.add_theme_color_override("font_color", Color(1, 0.7, 0.3))
	kill_label.text = "x0"
	add_child(kill_label)

	# Hint
	hint_label = Label.new()
	hint_label.position = Vector2(300, 524)
	hint_label.add_theme_font_size_override("font_size", 10)
	hint_label.add_theme_color_override("font_color", Color(0.4, 0.4, 0.4, 0.5))
	hint_label.text = "WASD Move | Space Dodge | E Cook | 1/2/3 Pick Upgrade"
	add_child(hint_label)

func update_hp(current: float, maximum: float) -> void:
	var ratio = current / maximum
	hp_fill.size.x = 138 * ratio
	if ratio > 0.5:
		hp_fill.color = Color(0.2, 0.8, 0.3)
	elif ratio > 0.25:
		hp_fill.color = Color(0.9, 0.7, 0.1)
	else:
		hp_fill.color = Color(0.85, 0.2, 0.2)
	hp_label.text = "%d/%d" % [current, maximum]

func update_xp(current: int, needed: int, level: int) -> void:
	var ratio = float(current) / float(needed) if needed > 0 else 0
	xp_fill.size.x = 138 * ratio
	level_label.text = "Lv.%d" % level

func update_timer(game_time: float) -> void:
	var mins = int(game_time) / 60
	var secs = int(game_time) % 60
	timer_label.text = "%d:%02d" % [mins, secs]

func update_backpack(backpack: Array) -> void:
	for c in backpack_container.get_children():
		c.queue_free()

	for i in 8:  # Show up to 8 slots
		var lbl = Label.new()
		if i < backpack.size():
			var elem = backpack[i]
			var sym = GameData.ELEMENT_SYMBOLS.get(elem, "?")
			var col = GameData.ELEMENT_COLORS.get(elem, Color.GRAY)
			lbl.text = sym
			lbl.add_theme_color_override("font_color", col)
		else:
			lbl.text = "."
			lbl.add_theme_color_override("font_color", Color(0.2, 0.2, 0.2))
		lbl.add_theme_font_size_override("font_size", 13)
		backpack_container.add_child(lbl)

func update_equipment(slots: Array) -> void:
	for i in slots.size():
		if i >= equip_labels.size():
			break
		if slots[i].is_empty():
			equip_labels[i].text = "[--]"
			equip_labels[i].add_theme_color_override("font_color", Color(0.3, 0.3, 0.3))
		else:
			var name_str: String = slots[i].get("name", "???")
			var short = name_str.split(" ")[0]
			equip_labels[i].text = "[" + short + "]"
			var col: Color = slots[i].get("color", Color.WHITE)
			equip_labels[i].add_theme_color_override("font_color", col)

func add_kill() -> void:
	kills += 1
	kill_label.text = "x%d" % kills
