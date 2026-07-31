from django.db import models
from django.core.validators import MinLengthValidator
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.core.validators import MinLengthValidator
# Create your models here.

class Role(models.Model):
    role = models.CharField(max_length=50, unique=True)

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
    
class User(AbstractBaseUser):
    role = models.ForeignKey('Role', on_delete=models.CASCADE)
    firstname = models.CharField(max_length=20)
    lastname = models.CharField(max_length=20)
    email = models.EmailField(max_length=50, unique=True) 
    # AbstractBaseUser automatically provides a properly configured password field

    # Tell Django to use email for logging in instead of a username
    USERNAME_FIELD = 'email'
    
    # Link the custom manager
    objects = CustomUserManager()

    def __str__(self):
        return f"{self.firstname} {self.lastname} ({self.email})"
