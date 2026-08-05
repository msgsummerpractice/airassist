from django.db import models
from django.core.validators import MinLengthValidator
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import MinLengthValidator
from .roles import Roles

# Create your models here.
class Role(models.Model):
    role = models.CharField(max_length=50, choices=Roles.choices(), unique=True)

    def __str__(self):
        return self.role


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        # set_password hashes the password before saving
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        # Automatically get or create the "Admin" role
        admin_role, created = Role.objects.get_or_create(role="Admin")
        extra_fields.setdefault('role', admin_role)

        return self.create_user(email, password, **extra_fields)
    
class User(AbstractBaseUser, PermissionsMixin):
    role = models.ForeignKey('Role', on_delete=models.CASCADE)
    firstname = models.CharField(max_length=20)
    lastname = models.CharField(max_length=20)
    email = models.EmailField(max_length=50, unique=True)
    must_change_password = models.BooleanField(default = True)
     
    # AbstractBaseUser automatically provides a properly configured password field

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    # use email for logging in instead of a username
    USERNAME_FIELD = 'email'

    REQUIRED_FIELDS = ['firstname', 'lastname']

    # Link the custom manager
    objects = CustomUserManager()

    def __str__(self):
        return f"{self.firstname} {self.lastname} ({self.email})"
