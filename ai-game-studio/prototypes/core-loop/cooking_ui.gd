# PROTOTYPE - NOT FOR PRODUCTION
# Question: Does the collect-cook-fight loop feel fun?
# Date: 2026-03-29

extends CanvasLayer

signal dish_cooked(dish: Dictionary, ingredients_used: Array)
signal cooking_closed()

var backpack_ref: Array = []
var selected: Array = []
var buttons: Array = []
var result_label: Label
var cook_button: Button
var grid: HBoxContainer

func _ready() -> void:
	visible = false

	var panel = Panel.new()
	panel.position = Vector2(340, 160)
	panel.size = Vector2(600, 400)
	panel.name = "CookPanel"
	add_child(panel)

	var title = Label.new()
	title.text = "=== COOKING STATION ==="
	title.position = Vector2(30, 10)
	title.add_theme_font_size_override("font_size", 22)
	panel.add_child(title)

	var instr = Label.new()
	instr.text = "Click 2 ingredients to combine. Press Cook or close with [E]."
	instr.position = Vector2(30, 50)
	instr.add_theme_font_size_override("font_size", 14)
	panel.add_child(instr)

	grid = HBoxContainer.new()
	grid.position = Vector2(30, 90)
	grid.name = "Grid"
	panel.add_child(grid)

	result_label = Label.new()
	result_label.text = "Select 2 ingredients..."
	result_label.position = Vector2(30, 200)
	result_label.add_theme_font_size_override("font_size", 16)
	panel.add_child(result_label)

	cook_button = Button.new()
	cook_button.text = "COOK!"
	cook_button.position = Vector2(250, 300)
	cook_button.size = Vector2(100, 40)
	cook_button.disabled = true
	cook_button.pressed.connect(_on_cook)
	panel.add_child(cook_button)

	var close_button = Button.new()
	close_button.text = "Close"
	close_button.position = Vector2(370, 300)
	close_button.size = Vector2(80, 40)
	close_button.pressed.connect(_close)
	panel.add_child(close_button)

func open(backpack: Array) -> void:
	backpack_ref = backpack
	selected.clear()
	visible = true
	get_tree().paused = true
	process_mode = Node.PROCESS_MODE_ALWAYS
	_rebuild_buttons()
	_update_preview()

func _close() -> void:
	visible = false
	get_tree().paused = false
	cooking_closed.emit()

func _rebuild_buttons() -> void:
	for b in buttons:
		if is_instance_valid(b):
			b.queue_free()
	buttons.clear()

	for i in backpack_ref.size():
		var elem: int = backpack_ref[i]
		var btn = Button.new()
		var ename: String = GameData.ELEMENT_NAMES.get(elem, "???")
		btn.text = "%s [%s]" % [GameData.ELEMENT_SYMBOLS.get(elem, "?"), ename]
		btn.custom_minimum_size = Vector2(80, 40)
		btn.pressed.connect(_on_ingredient_clicked.bind(i))
		grid.add_child(btn)
		buttons.append(btn)

func _on_ingredient_clicked(index: int) -> void:
	if index in selected:
		selected.erase(index)
	elif selected.size() < 2:
		selected.append(index)
	_update_button_styles()
	_update_preview()

func _update_button_styles() -> void:
	for i in buttons.size():
		if not is_instance_valid(buttons[i]):
			continue
		if i in selected:
			buttons[i].modulate = Color(1, 1, 0.5)
		else:
			buttons[i].modulate = Color.WHITE

func _update_preview() -> void:
	if selected.size() < 2:
		result_label.text = "Select %d more ingredient(s)..." % (2 - selected.size())
		cook_button.disabled = true
		return

	var a: int = backpack_ref[selected[0]]
	var b: int = backpack_ref[selected[1]]
	var recipe = GameData.lookup_recipe(a, b)
	result_label.text = "Result: %s (DMG: %d, Effect: %s)" % [recipe.name, recipe.damage, recipe.effect]
	cook_button.disabled = false

func _on_cook() -> void:
	if selected.size() < 2:
		return
	var a: int = backpack_ref[selected[0]]
	var b: int = backpack_ref[selected[1]]
	var recipe = GameData.lookup_recipe(a, b)

	var indices = selected.duplicate()
	indices.sort()
	indices.reverse()
	var used: Array = []
	for idx in indices:
		used.append(backpack_ref[idx])
		backpack_ref.remove_at(idx)

	dish_cooked.emit(recipe, used)
	selected.clear()
	_rebuild_buttons()
	_update_preview()

var e_was_pressed: bool = false

func _process(_delta: float) -> void:
	if not visible:
		return
	var e_now = Input.is_key_pressed(KEY_E)
	if e_now and not e_was_pressed:
		_close()
	e_was_pressed = e_now
