from django.db import models

# Create your models here.

#CREATE TABLE Roles(
#  roleId SERIAL PRIMARY KEY,
#   role VARCHAR(50) NOT NULL
#);

#CREATE TABLE USERS(
 ##	roleId INT NOT NULL,
#	firstName varchar(20),
#	lastName varchar(20),
#	email varchar(50),
#	password varchar(255),

#	CONSTRAINT fk_role
#	  FOREIGN Key(roleId)
#	  REFERENCES Roles(roleId)
 
#);
# INSERT INTO Roles(role)
#VALUES
#('System_Admin'),
#('Colleague'),
#('Passenger')
# 
# 
# 
# 
# 
#  SQLQuery for reference. Now to the model creation
class Role(models.Model):
    roleId = models.AutoField(primary_key=True)
    role = models.CharField(max_length=50)

    def __str__(self):
        return self.role

class User(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    first_Name = models.CharField(max_length=20)
    last_Name = models.CharField(max_length = 20)
    email = models.EmailField(max_length = 50, unique = True)
    password = models.CharField(max_length = 255)

    def __str__(self):
        return f"{self.firstName} {self.lastName} ({self.email})"    
    

