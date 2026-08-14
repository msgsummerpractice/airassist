# Change the creation endpoint so that the user receives upon creation an email with his details:
# userId, roleId, firstName, lastName, email and password

from django.conf import settings
from django.core.mail import EmailMessage
from pathlib import Path
from email.mime.image import MIMEImage
from django.template.loader import render_to_string
from django.db import transaction


def send_basic_email(to_email, subject, body):
    email = EmailMessage(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email],
    )

    return email.send()


def send_user_created_email(user, plain_password):
    html_body = render_to_string("create_user.html",
                                 {
                                     "user_id": user.id,
                                     "role_id": user.role.id,
                                     "first_name": user.firstname,
                                     "last_name": user.lastname,
                                     "email": user.email,
                                     "password": plain_password
                                 },
                                 )

    email = EmailMessage(
        subject="Acocunt creation",
        body=html_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email]
    )

    email.content_subtype = "html"
    logo_path = (Path(settings.BASE_DIR)/"case_email" /
                 "assets"/"logo_placeholder.png")
    with open(logo_path, "rb") as image_file:
        logo = MIMEImage(image_file.read())

    logo.add_header("Content-ID", "<logo_placeholder>")

    logo.add_header(
        "Content-Disposition",
        "inline",
        filename="logo_placeholder.png"
    )
    email.attach(logo)
    return email.send()


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
