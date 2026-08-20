from rest_framework.views import exception_handler as drf_exception_handler


def airassist_exception_handler(exc, context):
    """Wraps DRF's default handler so API errors use the {"message": ...} shape used across the app."""
    response = drf_exception_handler(exc, context)

    if response is not None and isinstance(response.data, dict) and "detail" in response.data:
        response.data = {"message": response.data["detail"]}

    return response
