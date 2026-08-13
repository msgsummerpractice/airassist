from rest_framework.permissions import BasePermission
from user.enums.roles import Roles

class IsColleague(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not getattr(user, "is_authenticated", False):
            return False
        role_name = getattr(getattr(user, "role", None), "role", None)
        return role_name == Roles.COLLEAGUE.value