## Change the creation endpoint so that the user receives upon creation an email with his details: 
# userId, roleId, firstName, lastName, email and password

from django.conf import settings
from django.core.mail import EmailMessage


def send_user_created_email(user,plain_password):
    body = f"""
 Hello {user.firstname},

 Your AirAssist account has been crated succesfully.

 User ID: {user.id}
 Role ID: {user.role.id}
 First Name: {user.firstname}
 Last Name: {user.lastname}
 Email: {user.email}
 Password: {plain_password}

 Have a nice day,
 AirAssist Team
 """
    return send_basic_email(
        to_email = user.email,
        subject = "Account Created",
        body= body
    )
    