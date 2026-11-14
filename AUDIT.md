# Premium-feel audit (v0.6)

This audit checks BUILT against the game-dev skills vendored in `.claude/skills/` (sources and licenses are in `.claude/skills/THIRD_PARTY.md`).
It was verified in headless Chromium on an iPhone 13 (portrait and landscape) and on 1440×900 desktop.

Status: ✅ fixed in v0.6 · ⏳ open

## game-feel: feedback tiers, easing, accessibility toggles
| Finding | Status |
|---|---|
| Building actions (room, furniture, door, paint, remove, error) had no feedback beyond a state change | ✅ `src/ui/fx.js`: one `feedback(event)` entry point; tiered synthesized sounds and haptics (small: UI taps, medium: building, large: review) |
| Errors were silent text | ✅ error toast slides in and shakes, with a double-buzz and a low "nope" sound |
| New rooms and items appeared instantly | ✅ rooms scale in, furniture pops with overshoot easing, and placing in 3D sends out an expanding ring |
| Review was a static page | ✅ score counts up with ticks, stars pop one by one with rising pitch, a rubber stamp (APPROVED / ACCEPTED / REJECTED) thuds onto the render, and a fanfare or fail sting plays |
| Reward cards appeared flat | ✅ cards flip in, staggered |
| No reduce-motion, sound or haptic options | ✅ Settings (gear on Home and Studio): sound, haptics, reduce motion. Reduce motion defaults to the OS preference and disables animations, camera glides and auto-rotate |
| No screen shake or hit-stop | Intentional: this is a calm design game, so the stamp "thud" is the only shake. Flashes stay well under 3 per second |

## camera-systems: frame-rate-independent smoothing, clamping
| Finding | Status |
|---|---|
| Plan fit and zoom buttons snapped instantly | ✅ eased with `1 - exp(-rate·dt)` (frame-rate independent) |
| Plan pan stopped dead on release | ✅ inertial fling with exponential decay |
| Plan could be panned or zoomed until the lot was lost | ✅ view centre and zoom are clamped to the lot |
| 3D view snapped between levels | ✅ the orbit target glides to the active level |
| 3D pitch could look under the ground | ✅ already clamped (`maxPolarAngle`), with damping on |

## game-ui-ux: safe areas, screen stack, touch targets, accessibility
| Finding | Status |
|---|---|
| Notched phones: the top bar sat under the status bar or notch, and the rail sat under the landscape notch | ✅ `env(safe-area-inset-*)` on the editor top bar, tool rail, palette and page headers |
| Browser or phone back left the game | ✅ screens form a history stack (editor → studio → home); the back gesture steps back a screen, and review and career-end are guarded |
| Touch targets of 28–36 px (quality picker, chips, level pills) | ✅ `pointer: coarse` raises them to 38–44 px |
| 9 px labels on phones | ✅ raised to 10–11 px on touch screens |
| No visible keyboard focus | ✅ `:focus-visible` ring; the toast is `role=status`; settings switches use `role=switch` |
| Colour-only signals | ✅ checklist uses ticks, quality pickers carry labels, and invalid placement both turns red and explains itself in a toast |
| Gamepad navigation | ⏳ not targeted (touch and mouse game) |

## build-mobile-threejs-games / optimize-web-animations / performance-optimization
| Finding | Status |
|---|---|
| The 3D views rendered at 60 fps even when nothing moved, draining battery | ✅ render on demand: renders only on camera change, damping, scene edits or animations. Measured idle draw calls over 3 s: **0** (was continuous) |
| RAF kept running in background tabs and offscreen | ✅ paused on `visibilitychange` and by an `IntersectionObserver` |
| Same quality on every device | ✅ touch or ≤4-core devices get pixel ratio 1.5 and 1024² shadows; desktop gets 2 and 2048² |
| WebGL contexts leaked (one per snapshot and per view) | ✅ `forceContextLoss()` on dispose; overlay materials are disposed too |
| Long-session check | ⏳ not profiled on a real device yet; please run a 10-minute session on a phone |

## threejs-materials-lighting
| Finding | Status |
|---|---|
| No tone mapping: harsh highlights and flat midtones | ✅ `NeutralToneMapping` |
| Lit only by hemisphere and sun, so materials looked plastic | ✅ PMREM `RoomEnvironment` as a soft environment light (dimmed at night) |
| Hard shadow edges | ✅ shadow radius softened |
| Point lights with shadows would tank mobile | ✅ night point lights are capped at 14 and cast no shadows |

## Still open
- Real-device QA: audio unlock on iOS (the first sound plays after a tap), thermal throttling and haptics. iOS Safari ignores `navigator.vibrate`, so iPhones get sound only.
- Undo or redo while the 3D camera is mid-glide is fine, but there's no "camera follows the last placed item" yet.
- Gamepad support (not a target).
