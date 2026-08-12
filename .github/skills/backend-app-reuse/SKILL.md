---
name: backend-app-reuse
description: "Create Django backend files and new backend apps that match the existing AirAssistBackend structure. Use when implementing backend tasks such as separate app creation, colleague case creation, passenger or flight or disruption validation reuse, creation confirmations, serializers, services, views, models, enums, urls, and app scaffolding. First inspect the Python backend to find existing implementations and reuse them. Prefer new files and a separate app like case or user. Do not change logic in existing backend files unless the user explicitly asks for registration or wiring changes."
argument-hint: "Describe the backend feature, target app name, and what existing flow should be reused."
user-invocable: true
---

# Backend App Reuse

## When To Use

- Create a new Django backend app that should look like the existing `case`, `user`, or `airports` apps.
- Implement backend files that must reuse existing serializers, services, models, validations, permissions, or response patterns.
- Build tasks such as colleague case creation, passenger or flight or disruption validation reuse, and creation confirmation responses.
- Add a new backend slice while preserving logic in existing files.

## Non-Negotiable Rules

1. Study the Python backend before editing anything. Start with the files under `AirAssistBackend/`, `case/`, `user/`, `airports/`, and any neighboring app that matches the requested behavior.
2. Reuse existing implementation before writing new logic. Favor serializers, services, enums, permissions, and response helpers that already exist.
3. Preserve behavior in existing backend files. Do not modify existing implementation logic unless the user explicitly asks for it.
4. Prefer creating a separate app, with the same folder conventions as the existing apps, when the feature is described as a new backend app.
5. Keep changes minimal and local. If wiring changes are required, limit them to registration steps such as app registration, URL inclusion, or imports.

## Required Discovery Pass

Before the first edit, inspect the backend for reusable code.

1. Read the relevant app structure and routing:
   - `AirAssistBackend/settings.py`
   - `AirAssistBackend/urls.py`
   - the closest existing app `urls.py`, `views/`, `serializers/`, `services/`, and `models/`
2. Search for existing validation and creation flows that match the requested feature.
3. Identify one concrete implementation surface to reuse and one concrete file where the new feature should live.
4. Only after that, create the new app files or feature files.

Use this reference while exploring: [backend conventions](./references/backend-conventions.md)

## App Structure To Mirror

When creating a separate backend app, mirror this structure unless the feature clearly does not need one of the folders.

```text
app_name/
  __init__.py
  admin.py
  apps.py
  constants.py
  urls.py
  migrations/
    __init__.py
  enums/
  models/
  serializers/
  services/
  tests/
  views/
```

## Implementation Workflow

1. Discover reuse candidates in the existing backend.
2. Decide whether the work belongs in a new app or an existing app. If the request says separate app, create a new app.
3. Create only the new files needed for the feature.
4. Reuse validation logic instead of duplicating rules.
5. Reuse response patterns instead of inventing a new payload shape.
6. Add tests for the new app or new feature slice when a nearby test pattern exists.
7. Validate with the narrowest backend test or command available.

## Reuse Checklist For The User's Current Backend Tasks

For tasks like colleague case creation, use this order of preference.

1. Reuse the existing case creation serializer and related nested serializers if they already validate the required passenger, flight, and disruption payloads.
2. Reuse existing service logic for case-related side effects such as compensation or passenger account creation if that behavior is still required.
3. Reuse the existing response style that confirms successful creation.
4. If colleague access needs different permissions or entry points, add a new app or new endpoint without rewriting the existing case creation logic.

## Specific Guidance For AirAssistBackend

- Prefer serializer validation methods and nested serializers over ad hoc validation in views.
- Prefer service classes for business logic and transactional orchestration.
- Prefer enum `.value` values for model defaults and comparisons.
- Prefer existing response helpers when a user-facing success or error message already has a project pattern.
- For file uploads or multipart forms, follow the parser and serializer patterns already used by the case creation flow.
- For auth-sensitive endpoints, mirror the permission patterns from the `user` app.

## Guardrails

- Do not replace or rewrite existing case creation behavior unless explicitly requested.
- Do not fork existing validation rules into a second implementation if they can be imported or called directly.
- Do not introduce a brand new response envelope if an existing endpoint already returns the needed creation confirmation shape.
- Do not modify unrelated apps while scaffolding the new app.

## Deliverable Shape

When you use this skill for implementation, the expected result is:

- a new backend app or backend feature slice with files matching the repository pattern
- explicit reuse of existing validators or serializers or services
- a creation confirmation response
- minimal wiring only where necessary
- no logic changes in existing backend files unless the user approved them
