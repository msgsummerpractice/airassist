---
name: frontend-mui-tailwind
description: 'Create or update frontend React files in AirAssisFrontend using the existing project structure, MUI components, MUI icons, shared theme, and Tailwind when useful. Use when implementing pages, forms, wizards, components, layouts, styling, and UI cleanup. First inspect the current frontend files to reuse existing structure and patterns. Prefer MUI primitives and icons over raw HTML, keep styling consistent with the theme, and keep files organized like the current project.'
argument-hint: 'Describe the frontend feature, target component or folder, and whether it should use MUI, Tailwind, or both.'
user-invocable: true
---

# Frontend MUI Tailwind

## When To Use

- Create new React components, pages, wizard steps, or UI flows in `AirAssisFrontend`.
- Update frontend forms, dialogs, cards, navigation, or layouts.
- Add styling while staying consistent with the current MUI-based frontend.
- Keep frontend code organized with the same clean structure already used in the repository.

## Non-Negotiable Rules

1. Study the existing frontend before editing. Start with `src/components/`, `src/theme/theme.ts`, `src/App.tsx`, and the closest existing component folder.
2. Prefer MUI components before raw HTML elements when an existing MUI primitive fits the job.
3. Prefer MUI icons from `@mui/icons-material` for action, status, form, and navigation icons.
4. Reuse the shared theme instead of inventing a separate visual system.
5. Use Tailwind as a utility layer when it helps with layout or spacing, but do not let it fight the MUI component system.
6. Keep component structure clean and local: component code beside its related CSS or subcomponents, matching the current project layout.
7. Do not refactor unrelated frontend files while implementing a new UI task.

## Required Discovery Pass

Before the first edit:

1. Read `AirAssisFrontend/package.json` to confirm the frontend stack and available styling tools.
2. Read `AirAssisFrontend/src/theme/theme.ts` to reuse palette, typography, radius, and component overrides.
3. Read the nearest existing component or feature folder under `AirAssisFrontend/src/components/`.
4. Identify one concrete component pattern to reuse and one target file or folder where the new feature should live.

Use this reference while exploring: [frontend conventions](./references/frontend-conventions.md)

## Structure To Mirror

Mirror the existing project organization unless the feature clearly needs a different local split.

```text
AirAssisFrontend/src/
  components/
    feature-name/
      Component.tsx
      component.css
      subcomponents/
  theme/
    theme.ts
  App.tsx
  main.tsx
```

For multi-step flows, prefer the same style as the current wizard structure:

```text
components/
  wizard/
    steps/
      StepName/
        index.tsx
        ChildPart.tsx
```

## Styling Rules

- Use MUI layout and form primitives such as `Box`, `Stack`, `Card`, `CardContent`, `Typography`, `TextField`, `Button`, `Alert`, `Divider`, `Chip`, `Autocomplete`, and similar components first.
- Use the `sx` prop for small component-local styling that is tightly coupled to MUI components.
- Use colocated CSS files for page-level or reusable visual styling that is already following the existing component pattern.
- Use Tailwind utilities for concise layout and spacing only when they improve clarity; avoid mixing large Tailwind class strings with large `sx` objects on the same element unless there is a clear reason.
- Reuse theme tokens, palette colors, typography variants, border radius, and shadow conventions from `src/theme/theme.ts`.
- Prefer responsive patterns already visible in the project, including mobile-aware padding and layout adjustments.

## MUI Rules

- Import components from `@mui/material`.
- Import icons from `@mui/icons-material` instead of custom inline SVG when a standard icon exists.
- Prefer MUI composition patterns such as `InputAdornment`, `IconButton`, `Alert`, `CardContent`, and `Stack` instead of hand-rolled equivalents.
- Prefer existing MUI variants like `contained`, `outlined`, and `text` before custom button styling.
- Use theme typography variants like `h1`, `h2`, `body1`, `body2`, and `caption` instead of raw heading styling where possible.

## Tailwind Rules

- Tailwind is available in the frontend toolchain, so it can be used for utility-first layout or spacing.
- Keep Tailwind usage readable and intentional.
- Prefer Tailwind for short, obvious utilities rather than encoding an entire design system inline.
- Do not replace existing MUI-based form controls with raw Tailwind-styled HTML controls unless the user explicitly asks for that.

## Clean Structure Rules

- Keep feature code near its related files.
- Split subcomponents only when the parent becomes hard to read or when the subcomponent is reusable within the feature.
- Keep naming explicit and aligned with the existing folders like `login`, `wizard`, and `theme`.
- Avoid dumping unrelated UI into `App.tsx`; use feature folders under `src/components/`.

## Implementation Workflow

1. Inspect the nearest existing UI pattern.
2. Pick the target folder that best matches the feature.
3. Build the UI with MUI-first composition.
4. Add icons from `@mui/icons-material` when actions or states need visual support.
5. Use Tailwind only where it improves layout clarity without conflicting with MUI.
6. Keep styles local and structure tidy.
7. Validate with the narrowest available frontend check, typically lint or build.

## Guardrails

- Do not introduce a separate component library when MUI already covers the need.
- Do not introduce inconsistent spacing, typography, or colors that bypass the shared theme without a good reason.
- Do not collapse feature structure into oversized single files if the existing project already splits that kind of UI.
- Do not switch an existing MUI-based screen to a raw Tailwind-only implementation unless explicitly requested.

## Deliverable Shape

When you use this skill for implementation, the expected result is:

- frontend files placed in the right feature folder
- MUI-first component composition
- icons from `@mui/icons-material` where appropriate
- Tailwind used selectively and cleanly
- styling aligned with the shared theme and existing frontend structure
- minimal unrelated edits