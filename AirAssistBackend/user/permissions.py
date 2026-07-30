from rest_framework.permissions import BasePermission

class IsSystemAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role.role == 'System_Admin'