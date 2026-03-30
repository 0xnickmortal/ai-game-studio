# Godot — Version Reference

| Field | Value |
|-------|-------|
| **Engine Version** | 4.5.1 |
| **Project Pinned** | 2026-03-29 |
| **LLM Knowledge Cutoff** | May 2025 |
| **Risk Level** | MEDIUM-HIGH — versions 4.4 and 4.5 are beyond LLM training data (~4.3) |

## Key Changes Since LLM Training Cutoff

### Godot 4.4 (from 4.3)
- 3D physics interpolation introduced (SceneTree-based)
- Various rendering pipeline improvements

### Godot 4.5 Breaking Changes
- **Jolt Physics**: "Areas Detect Static Bodies" setting removed — now always enabled
- **Navigation**: 2D/3D region/link updates are now asynchronous
- **NavigationServer2D**: Avoidance callbacks changed from Vector3 to Vector2
- **TileMap physics**: Single body now covers multiple cells via chunked physics
- **Internal nodes**: No longer duplicated during scene operations
- **NodeOneShot fading**: Uses self delta instead of input delta
- **JSONRPC**: `set_scope()` removed — use `set_method()` for manual registration
- **Windows**: Dropped support for Windows 7 and 8.1

### Godot 4.5 New GDScript Features
- **Variadic arguments**: Functions accept arbitrary params with `...` syntax
- **Abstract classes/methods**: `@abstract` annotation prevents direct instantiation
- **`duplicate_deep()`**: New method on Arrays, Dictionaries, Resources for full deep copy
- **Variant exports**: Can export `Variant`-typed variables with dynamic type in editor
- **Script backtracing**: Exact error locations even in Release builds

### Godot 4.5 New Engine Features
- Custom loggers for intercepting log messages/errors
- Signal source auto-append option
- Editor language switching without restart
- WebAssembly SIMD support for web exports
- visionOS export support

## Agent Instructions

Before suggesting any API or pattern:
1. Check this file for breaking changes in the relevant area
2. If uncertain about an API, use WebSearch to verify against 4.5 docs
3. Prefer patterns confirmed to work in 4.4+ over older patterns

Last verified: 2026-03-29
