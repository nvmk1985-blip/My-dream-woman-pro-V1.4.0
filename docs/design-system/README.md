# My Dream Women Pro design foundation

This is the design reference for the dark premium visual direction used by My Dream Women Pro. It is a design/documentation deliverable; the icon exports here are not connected to the Expo app.

## Current implementation status

The live repository handoff identifies `feature/black-leather-royal-gold` as the current feature branch. Shared design tokens are implemented in `artifacts/tamil-ai-chat/constants/colors.ts` and exposed by `artifacts/tamil-ai-chat/hooks/useColors.ts`. The branch's `future/step-2-design-system.md` records the code changes and verification limits.

The component guidance below is for consistent future implementation. Do not copy raw colors into app screens; use `useColors()` and its semantic roles.

## Direction

- Obsidian and leather-black surfaces with subtle depth.
- Royal gold marks premium/primary actions.
- Cyan and sky blue indicate focus, active controls, and interactive highlights.
- Gold/cyan glow is soft and selective; it must not reduce text contrast.
- Tamil copy remains Tamil. Inter is used for Latin UI text, with platform fallback for Tamil glyphs.

## Token references

`tokens.json` is a readable design export of the current `useColors()` values, not a second runtime source. The application source remains `constants/colors.ts` and `useColors.ts`.

| Role | Token examples |
| --- | --- |
| Base surfaces | `bgPrimary`, `bgSecondary`, `bgTertiary`, `bgElevated`, `leatherBlack` |
| Premium action | `goldPrimary`, `goldBright`, `buttonGold`, `textOnGold` |
| Active/focus | `cyanPrimary`, `cyanBright`, `inputFocus`, `buttonCyan` |
| Text | `textPrimary`, `textSecondary`, `textTertiary`, `textMuted` |
| Status | `success`, `warning`, `error`, `info` |
| Effects | `goldGlow`, `cyanGlow`, `premiumDarkGlass` |

## Reusable component rules

- **Cards:** dark/glass fill, quiet border, consistent interior spacing. Reserve a stronger border/glow for selected or premium cards.
- **Buttons:** gold for the primary action; cyan for focus or a distinct secondary action; dark surface for quiet actions. Destructive and disabled states remain visibly distinct.
- **Inputs:** persistent label, readable placeholder, explicit focus border, and a separate error message.
- **Toggles/segments:** communicate selection through both label/shape and color. Use at least 44 dp touch targets.
- **Sheets:** clear title, dimmed backdrop, close/cancel affordance, and predictable focus order.
- **Status/error/media:** pair color with text or icon; show loading, ready, empty, and recoverable error states. Media failures include a retry action.

Use the RN-specific implementation notes in [`../AGENTS.md`](../AGENTS.md) when applying these patterns to app code.

## App icon exports

These are design concepts only and must not be substituted into app runtime assets without explicit approval:

- `assets/my-dream-women-pro-icon.svg` — editable master.
- `assets/my-dream-women-pro-icon-1024.png` — square store/icon export.
- `assets/my-dream-women-pro-adaptive-foreground.svg` and `.png` — transparent foreground art inside the Android adaptive safe zone.
- `assets/my-dream-women-pro-adaptive-background.svg` and `.png` — full-bleed obsidian background.

The concept uses an obsidian field, a gold heart/halo, and a cyan light accent to remain recognizable at small sizes without embedding text that would become illegible.
