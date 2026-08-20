from django.http import JsonResponse

from .custom_exceptions.exceptions import CaseBackendError


class CaseBackendExceptionMiddleware:
    """Catches CaseBackendError raised outside of DRF views (plain Django code paths)
    and turns it into a JSON error response instead of a 500 debug page."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        if isinstance(exception, CaseBackendError):
            return JsonResponse({"message": exception.message}, status=500)
        return None
