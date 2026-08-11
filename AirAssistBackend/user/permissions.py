from rest_framework.permissions import BasePermission

class IsSystemAdmin(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not getattr(user, "is_authenticated", False):
            return False
        role_name = getattr(getattr(user, "role", None), "role", None)
        return role_name == "SYSTEM_ADMIN"