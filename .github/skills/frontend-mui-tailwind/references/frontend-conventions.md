# Frontend Conventions

Use this file during the discovery pass before creating or editing frontend UI in `AirAssisFrontend`.

## Current Stack

- React 19
- TypeScript
- Vite
- MUI via `@mui/material`
- MUI icons via `@mui/icons-material`
- Emotion styling support through MUI
- Tailwind available through `tailwindcss` and `@tailwindcss/vite`

Confirm versions in `AirAssisFrontend/package.json` before making assumptions.

## Existing Structure

Important folders:

```text
AirAssisFrontend/src/
  components/
    login/
    wizard/
  theme/
    theme.ts
  App.tsx
  App.css
  index.css
  main.tsx
```

The current structure favors feature folders under `src/components/` and a shared theme in `src/theme/theme.ts`.

## Reuse Targets

### Theme and design tokens
- `AirAssisFrontend/src/theme/theme.ts`

Reuse this for:
- palette choices
- typography variants
- component radius and shadow conventions
- MUI component overrides

### Form and card composition
- `AirAssisFrontend/src/components/login/login.tsx`
- `AirAssisFrontend/src/components/login/reset_password.tsx`

Reuse these for:
- auth forms
- alert handling
- text fields with adornments
- password visibility toggles with MUI icons
- colocated CSS plus MUI `sx`

### Wizard and step layout
- `AirAssisFrontend/src/components/wizard/steps/FlightItineraryStep/index.tsx`
- neighboring step files under `AirAssisFrontend/src/components/wizard/steps/`

Reuse these for:
- multi-step UI structure
- card-based layouts
- `Box`, `Stack`, `Typography`, `Divider`, and `Button` composition
- splitting larger UI into local subcomponents

## Pattern Guidance

1. Prefer MUI components as the base building blocks.
2. Prefer MUI icons instead of ad hoc inline icons when a built-in icon exists.
3. Use `sx` for component-scoped MUI styling.
4. Use colocated CSS files for feature-specific page styling already following the repo pattern.
5. Use Tailwind utilities selectively for layout or spacing if they help readability.

## Structure Guidance

- New feature UI should usually live under `AirAssisFrontend/src/components/<feature>/`.
- Multi-part features can have nested subcomponents.
- Reuse folder naming that communicates feature intent clearly.
- Keep `App.tsx` and `main.tsx` lean; do not move feature complexity there.

## Validation Guidance

After edits, prefer one of these checks:

1. `npm run lint` in `AirAssisFrontend`
2. `npm run build` in `AirAssisFrontend`

Use the narrowest check that validates the changed UI slice.