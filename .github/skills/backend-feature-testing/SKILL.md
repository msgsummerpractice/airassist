---
name: backend-feature-testing
description: "Test Django backend features end-to-end by validating API behavior, status codes, response payloads, side effects, and database updates. Use when asked to verify each endpoint works as expected, test feature flows, confirm DB persistence changes, and validate negative/error scenarios like a QA tester."
argument-hint: "Describe what feature or endpoint group to test, expected behavior, required database assertions, and whether to run only tests or also propose fixes."
user-invocable: true
---

# Backend Feature Testing

## When To Use

- Verify that each backend endpoint works as expected.
- Test full feature flows across serializers, services, views, and models.
- Validate database updates after API operations.
- Confirm response status codes and payload contracts.
- Validate negative scenarios and error handling.

## Not For

- Frontend rendering tests.
- Pure code style review without execution.
- Security penetration testing.

## Testing Mindset

Act like a backend QA tester.

1. Validate happy path behavior.
2. Validate business rule enforcement.
3. Validate database side effects.
4. Validate error paths and invalid input handling.
5. Validate idempotency and state transitions where relevant.

## Required Discovery Pass

Before writing or running tests, inspect:

1. Endpoint wiring:
   - `AirAssistBackend/urls.py`
   - app-level `urls.py`
2. Endpoint handlers:
   - `views/`
3. Validation rules:
   - `serializers/`
   - `enums/`
   - `constants.py`
4. Business logic:
   - `services/`
5. Persistence targets:
   - `models/`
   - existing `migrations/`
6. Existing tests to mirror style:
   - `tests/`

## Core Test Matrix Per Endpoint

For each endpoint under test, cover:

1. Contract checks:
   - method, route, auth requirements, parser/content type.
2. Status checks:
   - expected success code (200/201/204).
   - expected validation code (400).
   - expected auth/permission codes (401/403) where applicable.
3. Response checks:
   - required top-level keys.
   - field types and semantic values.
4. Database checks:
   - row creation/update/delete in expected models.
   - no unintended writes in unrelated models.
   - correct foreign-key links.
5. Business checks:
   - domain rules and state transitions are enforced.
6. Failure checks:
   - invalid payload returns stable, informative errors.
   - inconsistent payloads do not partially corrupt data.

## Database Assertion Rules

- Assert both pre-condition and post-condition counts.
- Assert important field values, not only existence.
- Assert relationship integrity (case to flights, case to disruption, case to passenger).
- Assert transaction behavior: either full success or safe rollback for failing operations.

## Suggested Test Structure

Use `Arrange -> Act -> Assert` in each test.

1. Arrange:
   - prepare payload, auth context, and initial DB state.
2. Act:
   - call endpoint with Django/DRF test client.
3. Assert:
   - status code.
   - response body contract.
   - database side effects.

## AirAssistBackend-Specific Focus Areas

- Case submission flow:
  - eligibility precheck endpoint behavior.
  - create endpoint behavior.
  - expected case state updates.
- Data distribution consistency:
  - fields intended for `Case` versus `Flight` are validated in the correct table.
- Side effects:
  - email sending failures must not hide successful DB commits unless explicitly required.

## Output Format

Return test results grouped by endpoint.

For each endpoint include:

1. Endpoint and method.
2. Tested scenarios.
3. Pass/fail per scenario.
4. DB assertions performed.
5. Found issues with severity and fix recommendation.

If requested, also provide:

- missing test cases not currently covered.
- minimal test files or patches to add coverage.

## Optional Fix Mode

If the user asks for fixes after test failures:

1. Propose smallest safe fix per failing scenario.
2. Apply only requested fixes.
3. Re-run targeted tests.
4. Report before and after outcomes.
