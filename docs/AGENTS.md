# My Dream Women Pro — UI implementation guide

This guide applies to future Expo/React Native UI work in this repository. The current Step 2/3 implementation is on `feature/black-leather-royal-gold`; do not assume it has been merged to `main`.

## Design source of truth

- Read [`docs/design-system/README.md`](design-system/README.md) and [`docs/design-system/tokens.json`](design-system/tokens.json) before changing app UI.
- The runtime theme source is `artifacts/tamil-ai-chat/constants/colors.ts`; consume it through `artifacts/tamil-ai-chat/hooks/useColors.ts`.
- Prefer semantic token roles over direct hex values. Do not add a second palette or duplicate the token source in screens.
- This is a fixed dark brand palette in both system appearance modes. Do not change the app's appearance preference as part of a screen redesign.

## Visual and content rules

- Use the obsidian/leather surfaces as the base, with restrained royal gold for premium and primary actions and cyan/sky blue for focus and active interaction.
- Use success, warning, error, and info colors only for their semantic status roles. Do not use status colors decoratively.
- Keep glow soft and selective. Use the shared gold/cyan effects for emphasis, not on every card or control.
- Use Inter tokens for Latin UI text and preserve the platform font fallback for Tamil glyphs.
- Preserve existing Tamil copy unless the user explicitly asks for copy changes. Do not replace Tamil text with English or transliterations.
- Use the existing vector icon approach. Do not introduce an icon or font dependency for a visual-only phase.

## Component guidance

- **Cards:** use the shared dark/glass surface and a subtle border. Keep elevation and glow limited to selected or premium states.
- **Buttons:** distinguish gold primary, cyan action/focus, quiet secondary, destructive, and disabled states. Keep labels readable and preserve existing handlers.
- **Inputs:** keep persistent labels, visible focus/error borders, readable placeholders, and an explicit error message; do not rely on color alone.
- **Toggles and segmented controls:** show the selected state with both color and shape/label changes. Keep touch targets at least 44 dp; prefer 48 dp where space allows.
- **Sheets and dialogs:** retain a clear title, close/cancel affordance, focus order, and a strong dimmed backdrop. Use the project's existing presentation component rather than adding a new package.
- **Icons:** use consistent stroke weight and size; do not use emoji as interface icons.

## Status, errors, and media

- Use the semantic `success`, `warning`, `error`, and `info` tokens. Pair each status color with a text label or icon.
- Loading states should state what is happening and show progress when available.
- Empty states should explain what the user can do next.
- Failed media should retain a clear retry action and a concise Tamil explanation; do not leave a blank image region.
- Ready media should have a stable aspect ratio and a visible selected/preview state.

## Expo/React Native implementation

- Use `StyleSheet` and `useColors()` tokens for app code. Map glow tokens to React Native shadow/elevation properties; avoid web-only CSS shadows in native components.
- Use `Pressable`, `TextInput`, `Switch`, and the established sheet/dialog implementation in the app.
- Preserve current navigation, API payloads, storage, notifications, media flows, and event handlers during visual-only changes.
- Do not change app dependencies or lockfiles for a design-only phase without explicit approval.

## App icon boundary

The icon files under `docs/design-system/assets/` are design exports only. They are not wired into `app.json`, the runtime asset directory, splash screen, notification icon, or APK workflow. Replacing an app icon requires a separate explicit approval.
