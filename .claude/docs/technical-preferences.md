# Technical Preferences

## Engine & Language

- **Engine**: Godot 4.5.1
- **Language**: GDScript
- **Rendering**: Forward+
- **Physics**: Jolt Physics (默认)

## Naming Conventions

- **Classes**: PascalCase
- **Variables**: snake_case
- **Signals/Events**: snake_case (past tense: health_changed)
- **Files**: snake_case.gd
- **Scenes/Prefabs**: snake_case.tscn
- **Constants**: SCREAMING_SNAKE_CASE

## Performance Budgets

- **Target Framerate**: 60 FPS
- **Frame Budget**: 16.67 ms
- **Draw Calls**: < 2000
- **Memory Ceiling**: 2048 MB

## Testing

- **Framework**: GUT (Godot Unit Test)
- **Minimum Coverage**: [TO BE CONFIGURED]
- **Required Tests**: Balance formulas, gameplay systems, networking (if applicable)

## Forbidden Patterns

- [None configured yet — add as architectural decisions are made]

## Allowed Libraries / Addons

- [None configured yet — add as dependencies are approved]

## Architecture Decisions Log

- [No ADRs yet — use /architecture-decision to create one]
