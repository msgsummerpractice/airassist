# Change the creation endpoint so that the user receives upon creation an email with his details:
# userId, roleId, firstName, lastName, email and password

from django.conf import settings
from django.core.mail import EmailMessage
from pathlib import Path
from email.mime.image import MIMEImage
from django.template.loader import render_to_string


def send_basic_email(to_email, subject, body):
    email = EmailMessage(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email],
    )
    return email.send()


def send_template_email(to_email, subject, template_name, context):
    html_body = render_to_string(template_name, context)

    email = EmailMessage(
        subject=subject,
        body=html_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email],
    )
    email.content_subtype = "html"
    logo_path = (
        Path(settings.BASE_DIR)
        / "case_email"
        / "assets"
        / "logo_placeholder.png"
    )
    with logo_path.open("rb") as image_file:
        logo = MIMEImage(image_file.read())

    logo.add_header("Content-ID", "<logo_placeholder>")
    logo.add_header(
        "Content-Disposition",
        "inline",
        filename=logo_path.name,
    )
    email.attach(logo)

    return email.send()


def send_user_created_email(user, plain_password):
    return send_template_email(
        to_email=user.email,
        subject="Account Created",
        template_name="create_user.html",
        context={
            "user_id": user.id,
            "role_id": user.role.id,
            "first_name": user.firstname,
            "last_name": user.lastname,
            "email": user.email,
            "password": plain_password,
        },
    )


def send_password_reset_email(user, reset_url):
    return send_template_email(
        to_email=user.email,
        subject="Password Reset",
        template_name="emails/password_reset.html",
        context={
            "first_name": user.firstname,
            "reset_url": reset_url,
        },
    )

def send_case_status_update_email(passenger, case_id, case_status, note=""):
    status_labels = {
        "ELIGIBLE": "Eligible",
        "NON_ELIGIBLE": "Non-Eligible",
        "AWAITING_DOCUMENTS": "Awaiting Documents",
    }
    status_label = status_labels.get(case_status, case_status.replace("_", " ").title())

    return send_template_email(
        to_email=passenger.email,
        subject="Case Status Update",
        template_name="case_status_update.html",
        context={
            "first_name": passenger.first_name,
            "case_id": case_id,
            "case_status": status_label,
            "note": note,
        },
    )