## Prototype Report: Core Loop

### Hypothesis
The collect-ingredients → cook-at-station → fire-dishes loop will feel satisfying
in a 30-second play cycle, with the cooking station creating a meaningful strategic
pause between combat bursts.

### Approach
Built a single-room arena prototype with:
- Player (WASD + dodge roll with i-frames)
- 4-6 enemies that chase and drop element-typed ingredients on death
- Cooking station where 2 ingredients combine into a named dish with damage + effect
- Dishes equip to slots and fire as projectiles (LMB/RMB)
- 10 recipes covering all 6 elements with unique effects (burn, slow, knockback, etc.)
- Basic HUD showing HP, backpack, and equipment slots

Shortcuts taken: all visuals are colored rectangles, no audio, no menu, single room,
enemies only chase (no attack patterns), no set/meal bonuses, no inventory replacement UI.

**Files**: 9 GDScript files + 1 scene + project.godot

### Result
**AWAITING PLAYTEST** — The prototype is built and ready to open in Godot 4.5.1.

### Metrics
- Frame time: [measure during playtest]
- Feel assessment: [measure during playtest — focus on: pickup responsiveness,
  cooking flow interruption, dish-firing satisfaction]
- Player action counts: [measure during playtest]
- Iteration count: 1 (initial build)

### Recommendation: PENDING PLAYTEST

Open the project in Godot 4.5.1:
1. Open Godot → Import → navigate to `prototypes/core-loop/`
2. Import `project.godot`
3. Press F5 to run

**What to evaluate:**
- Does killing enemies → picking up drops feel responsive?
- Does walking to the cooking station feel like a rewarding pause or an interruption?
- Does selecting 2 ingredients and seeing the dish name create an "aha" moment?
- Does firing the dish at enemies feel impactful?
- Is the dodge roll timing (0.3s i-frames, 1.5s cooldown) punishing or fair?

### If Proceeding
- Replace ColorRect visuals with sprite assets
- Add enemy attack patterns (ranged, AOE, etc.)
- Implement multi-room floor generation
- Add set/meal bonus system (Layer 3)
- Build proper inventory UI with drag-and-drop
- Add recipe book discovery system
- Sound effects for cooking, firing, pickup
- Estimated production effort: significant — this validates only the micro+mid loop

### Lessons Learned
[To be filled after playtest]
