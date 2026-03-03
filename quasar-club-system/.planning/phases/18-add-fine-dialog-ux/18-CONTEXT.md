# Phase 18 Context: Add Fine Dialog UX/UI Redesign

## Phase Goal
Redesign CashboxAddFine.vue popup to feel like an in-app overlay (not a full-page takeover) with proper margins, rounded card styling matching the app's design system, and separate mobile/desktop layouts.

## Decisions

### 1. Dialog Sizing — Popup with Margins
- **Desktop (>=700px)**: Remove `maximized`. Use custom positioning with ~50px margin on all sides via `full-width full-height` + padding wrapper
- **Mobile (<700px)**: Nearly full-screen but with ~16px margin for the popup feel
- Use Quasar's `q-dialog` with a custom `dialog-class` or wrapper div for the margin approach

### 2. Card Styling — Match App Design System
- Use `border-radius: var(--card-radius)` (12px) on the dialog card
- Add `box-shadow: var(--card-shadow)` for depth
- Use `var(--app-bg)` (#f0f2f5) as background behind the card content sections
- Gradient header using `var(--gradient-primary)` with white text (like the cashbox history dialog pattern)

### 3. Layout — Desktop vs Mobile
- **Desktop**: Two-column layout — left column for fine selection (tabs), right column for player selection. Side-by-side gives better use of horizontal space.
- **Mobile**: Single-column stacked layout — fine selection on top, player selection below (current behavior but styled better)
- Use `useQuasar` screen width or CSS media queries for the breakpoint

### 4. Visual Polish
- Selected template chip: filled primary with slight scale effect
- Player list: alternating row backgrounds for readability
- Summary bar at bottom showing: selected amount, reason preview, player count
- Sticky footer with action buttons (doesn't scroll away)
- Template management section gets cleaner card styling

### 5. Keep All Existing Functionality
- All props, emits, and logic unchanged
- Predefined/Custom tabs stay
- Player search, select all/deselect all stay
- Template management stays
- Only the visual presentation changes

## Technical Constraints
- Single component change: `src/components/cashbox/CashboxAddFine.vue`
- No new dependencies
- Must work with existing parent component (CashboxComponent.vue) without changes
