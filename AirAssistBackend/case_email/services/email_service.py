## Change the creation endpoint so that the user receives upon creation an email with his details: 
# userId, roleId, firstName, lastName, email and password

from django.conf import settings
from django.core.mail import EmailMessage


def send_basic_email(to_email, subject, body):
    email = EmailMessage(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email],
    )

    return email.send()

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


def send_password_reset_email(user, reset_url):
    body = f"""
 Hello {user.firstname},

 We received a request to reset your AirAssist password.

 Use the link below to choose a new password:
 {reset_url}

 If you did not request this change, you can ignore this email.

 AirAssist Team
 """
    return send_basic_email(
        to_email=user.email,
        subject="Password Reset",
        body=body,
    )
    