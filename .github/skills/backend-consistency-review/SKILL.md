---
name: backend-consistency-review
description: "Review the Django backend for structural inconsistencies and contract drift across apps, models, serializers, services, views, urls, enums, and tests. Use when asked to run backend code review, consistency checks, architecture alignment checks, or structure validation across the AirAssistBackend codebase."
argument-hint: "Describe the review scope (whole backend or specific apps), what consistency rules matter most, and whether you want only findings or findings plus fixes."
user-invocable: true
---

# Backend Consistency Review

## When To Use

- Run a backend code review focused on inconsistencies.
- Validate that app structure is aligned across backend modules.
- Detect drift between models, serializers, services, views, and URL contracts.
- Audit naming, enums, field usage, response shape, and state transition consistency.
- Check whether similar flows in different apps follow the same architecture patterns.

## Not For

- Frontend UI review.
- Security-only review (unless explicitly requested).
- Performance profiling.
- Large feature implementation from scratch.

## Review Mindset

Prioritize high-impact correctness issues first.

1. Behavioral regressions and data integrity issues.
2. Contract mismatches across layers.
3. Structural inconsistencies that cause maintenance risk.
4. Naming/style consistency.

## Required Discovery Pass

Before reporting findings, inspect these backend areas:

1. Project wiring:
   - `AirAssistBackend/settings.py`
   - `AirAssistBackend/urls.py`
2. App-level routing and entrypoints:
   - each app `urls.py`
   - `views/`
3. Validation and payload contracts:
   - `serializers/`
4. Domain logic:
   - `services/`
5. Persistence model:
   - `models/`
   - `migrations/`
6. Shared constraints:
   - `constants.py`
   - `enums/`
7. Test coverage for reviewed flows:
   - `tests/`

## Consistency Checklist

Use this checklist during review.

1. Model to serializer alignment:
   - required fields, nullability, naming, and type compatibility.
2. Serializer to view alignment:
   - request fields, parser type, response schema, and status codes.
3. View to service alignment:
   - business logic stays in services, views remain orchestration-focused.
4. Service to model alignment:
   - field names and enum values are valid and consistent.
5. URL to frontend/client contract alignment:
   - endpoint paths, HTTP methods, payload shape, and response keys.
6. Enum and constants consistency:
   - no duplicated literal strings when enums/constants exist.
7. State-transition consistency:
   - case lifecycle changes are explicit and valid.
8. Error handling consistency:
   - validation errors, domain errors, and server errors are separated.
9. Transaction boundary consistency:
   - DB changes and side effects (email, external calls) are safely ordered.
10. App structure consistency:

- each app follows expected folders and file naming conventions.

## Structural Rules For AirAssistBackend

- Keep business rules in `services/`, not in views.
- Keep payload validation in serializers.
- Keep enums as the source of truth for categorical values.
- Prefer one response envelope pattern per API style.
- Avoid writing data into multiple models unless ownership is explicit.
- Ensure similarly named fields are consistently mapped (`destination_airport` vs `arrival_airport`, etc.).

## Output Format

Return findings sorted by severity with file references.

For each finding include:

1. Severity: Critical, High, Medium, or Low.
2. Location: file path and exact symbol or block.
3. Problem: what is inconsistent.
4. Risk: what can break or regress.
5. Recommended fix: smallest safe change.

If no findings are discovered, state that explicitly and include residual risks (for example: missing tests in key flows).

## Optional Fix Mode

If the user asks for fixes, apply changes with minimal blast radius.

1. Fix only reviewed inconsistencies.
2. Preserve existing behavior unless the inconsistency itself is the bug.
3. Re-run targeted checks after edits.
4. Summarize exactly what changed and why.
