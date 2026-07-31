from django.contrib import admin
from .models.models import User, Role
# Register your models here.
admin.site.register(Role)
admin.site.register(User)
