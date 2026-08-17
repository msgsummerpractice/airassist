from django.contrib import admin

from .models import SystemOption


@admin.register(SystemOption)
class SystemOptionAdmin(admin.ModelAdmin):
    list_display = ("option_type", "updated_by", "updated_at")
    search_fields = ("option_type",)
    readonly_fields = ("created_at", "updated_at")
