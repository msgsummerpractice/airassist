from django.http import JsonResponse

from .custom_exceptions.exceptions import AirAssistBackendError


class AirAssistBackendExceptionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        if isinstance(exception, AirAssistBackendError):
            return JsonResponse({"message": exception.message}, status=500)
        return None
