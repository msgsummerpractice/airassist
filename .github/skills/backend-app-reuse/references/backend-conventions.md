# Backend Conventions

Use this file during the discovery pass before creating a new backend app or backend feature.

## Existing App Layout

The repository uses Django apps with folders like:

```text
case/
user/
airports/
case_email/
```

The most complete pattern is:

```text
app_name/
  admin.py
  apps.py
  constants.py
  urls.py
  migrations/
  enums/
  models/
  serializers/
  services/
  tests/
  views/
```

## Reuse Targets

### Case creation flow

- `AirAssistBackend/case/views/case_creation_view.py`
- `AirAssistBackend/case/serializers/case_creation_serializer.py`
- `AirAssistBackend/case/serializers/disruption_serializer.py`
- `AirAssistBackend/case/serializers/flights_serializer.py`
- `AirAssistBackend/case/services/case_service.py`

Use these first when a feature needs:

- case creation
- passenger, flight, or disruption validation
- multipart upload handling
- creation confirmation responses

### User and auth patterns

- `AirAssistBackend/user/views/user_view.py`
- `AirAssistBackend/user/service/user_service.py`
- `AirAssistBackend/user/serializers/user_serializer.py`
- `AirAssistBackend/user/permissions.py`
- `AirAssistBackend/user/custom_exceptions/responses.py`

Use these when a feature needs:

- login-aware behavior
- role checks such as colleague or system admin access
- response helpers
- user creation or authentication patterns

## Reuse Rules

1. If a serializer already validates the needed payload, import and reuse it.
2. If a service already performs the needed domain action, call it instead of duplicating logic.
3. If an endpoint already returns a useful creation confirmation shape, mirror it.
4. If the feature must live in a separate app, keep existing logic in place and call into it from the new app.

## Wiring Conventions

- Register the app in `AirAssistBackend/AirAssistBackend/settings.py` only when the user wants the app wired into the project.
- Include app URLs in `AirAssistBackend/AirAssistBackend/urls.py` only when the new endpoints should be reachable.
- Keep wiring changes separate from logic changes.

## Validation Conventions

- Prefer DRF `validate_<field>()` methods for field checks.
- Prefer serializer `validate()` for cross-field checks.
- Reuse nested serializers for nested payload sections.
- Keep business rules out of views when they already belong in serializers or services.

## Response Conventions

Two response styles already exist:

1. Direct DRF `Response` payloads in the case creation flow with success flags and creation messages.
2. `AirAssistResponse` helper methods in the user app.

Before adding a new response format, pick the closer existing style and stay consistent with it.

## Risk Notes

- Existing files contain some inconsistencies. Reuse the stable patterns, but do not silently refactor existing code while building the new app.
- Preserve existing implementation logic unless the user explicitly asks for changes.
- If the new app needs tests, mirror the style of the nearest existing app tests instead of inventing a new pattern.
