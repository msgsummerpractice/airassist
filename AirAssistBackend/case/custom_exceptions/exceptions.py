from rest_framework import status
from rest_framework.exceptions import APIException

from user.constants import AIRASSIST_BACKEND


class CaseAPIException(APIException):
    """Base exception for DRF case views; the configured EXCEPTION_HANDLER turns this into a
    Response with the right status code automatically, no manual try/except needed in views."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "An error occurred while processing the request."
    default_code = "error"


class BadRequestAPIException(CaseAPIException):
    status_code = status.HTTP_400_BAD_REQUEST


class NotFoundAPIException(CaseAPIException):
    status_code = status.HTTP_404_NOT_FOUND


class ForbiddenAPIException(CaseAPIException):
    status_code = status.HTTP_403_FORBIDDEN


class CaseBackendError(Exception):
    """Base exception for backend-only code paths outside of DRF views (e.g. management
    commands, signals); caught by CaseBackendExceptionMiddleware."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(f"[{AIRASSIST_BACKEND}] {message}")
