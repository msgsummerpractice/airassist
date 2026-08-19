# Change the creation endpoint so that the user receives upon creation an email with his details:
# userId, roleId, firstName, lastName, email and password

import base64
import logging
import os
from email.mime.image import MIMEImage
from email.utils import formataddr
from pathlib import Path

import requests
from django.conf import settings
from django.core.mail import EmailMessage, get_connection
from django.template.loader import render_to_string

from system_options.services import SystemOptionService


SMTP_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send"
GRAPH_SCOPE = "https://graph.microsoft.com/.default"
logger = logging.getLogger(__name__)


def _get_email_preset():
    return SystemOptionService.get_email_preset()


def _build_from_email(email_preset):
    sender_name = email_preset.get("sender_name") or "AirAssist Team"
    sender_email = email_preset.get("sender_email") or settings.DEFAULT_FROM_EMAIL
    return formataddr((sender_name, sender_email))


def _build_reply_to(email_preset):
    reply_to_email = email_preset.get("reply_to_email")
    return [reply_to_email] if reply_to_email else None


def _render_preset_template(template, values):
    rendered = template

    for key, value in values.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", str(value or ""))

    return rendered


def _build_template_context(context, email_preset):
    sender_name = email_preset.get("sender_name") or "AirAssist Team"
    return {
        **context,
        "sender_name": sender_name,
        "organisation_name": sender_name,
        "footer_text": email_preset.get("footer_text", ""),
        "support_email": email_preset.get("sender_email") or settings.DEFAULT_FROM_EMAIL,
        "reply_to_email": email_preset.get("reply_to_email", ""),
    }


def _load_logo_attachment():
    logo_path = (
        Path(settings.BASE_DIR)
        / "case_email"
        / "assets"
        / "logo.png"
    )
    with logo_path.open("rb") as image_file:
        return {
            "filename": logo_path.name,
            "content": image_file.read(),
            "mimetype": "image/png",
            "content_id": "logo",
            "disposition": "inline",
        }


def _normalize_attachments(attachments):
    normalized = []

    for attachment in attachments or []:
        if isinstance(attachment, dict):
            normalized.append(attachment)
            continue

        filename, content, mimetype = attachment
        normalized.append(
            {
                "filename": filename,
                "content": content,
                "mimetype": mimetype,
                "content_id": None,
                "disposition": "attachment",
            }
        )

    return normalized


def _build_smtp_connection(email_preset):
    if settings.EMAIL_BACKEND != SMTP_BACKEND:
        return None

    return get_connection(
        backend=settings.EMAIL_BACKEND,
        host=email_preset.get("smtp_host") or settings.EMAIL_HOST,
        port=email_preset.get("smtp_port") or settings.EMAIL_PORT,
        username=email_preset.get("smtp_username") or settings.EMAIL_HOST_USER,
        password=os.getenv("EMAIL_HOST_PASSWORD") or settings.EMAIL_HOST_PASSWORD,
        use_tls=(
            email_preset.get("use_tls")
            if email_preset.get("use_tls") is not None
            else settings.EMAIL_USE_TLS
        ),
    )


def _send_via_smtp(to_email, subject, body, email_preset, attachments=None, html=False):
    email = EmailMessage(
        subject=subject,
        body=body,
        from_email=_build_from_email(email_preset),
        to=[to_email],
        reply_to=_build_reply_to(email_preset),
        connection=_build_smtp_connection(email_preset),
    )

    if html:
        email.content_subtype = "html"

    for attachment in _normalize_attachments(attachments):
        if attachment.get("disposition") == "inline" and attachment.get("content_id"):
            mime_subtype = attachment["mimetype"].split("/", 1)[1]
            mime_image = MIMEImage(attachment["content"], _subtype=mime_subtype)
            mime_image.add_header("Content-ID", f"<{attachment['content_id']}>")
            mime_image.add_header(
                "Content-Disposition",
                "inline",
                filename=attachment["filename"],
            )
            email.attach(mime_image)
            continue

        email.attach(
            attachment["filename"],
            attachment["content"],
            attachment["mimetype"],
        )

    return email.send()


def _send_via_sendgrid(to_email, subject, body, email_preset, attachments=None, html=False):
    api_key = os.getenv("SENDGRID_API_KEY")
    if not api_key:
        raise ValueError("SendGrid API key is not configured.")

    payload = {
        "personalizations": [
            {
                "to": [{"email": to_email}],
            }
        ],
        "from": {
            "email": email_preset.get("sender_email") or settings.DEFAULT_FROM_EMAIL,
            "name": email_preset.get("sender_name") or "AirAssist Team",
        },
        "subject": subject,
        "content": [
            {
                "type": "text/html" if html else "text/plain",
                "value": body,
            }
        ],
    }

    reply_to_email = email_preset.get("reply_to_email")
    if reply_to_email:
        payload["reply_to"] = {"email": reply_to_email}

    normalized_attachments = _normalize_attachments(attachments)
    if normalized_attachments:
        payload["attachments"] = [
            {
                "content": base64.b64encode(attachment["content"]).decode("ascii"),
                "filename": attachment["filename"],
                "type": attachment["mimetype"],
                "disposition": attachment.get("disposition", "attachment"),
                **(
                    {"content_id": attachment["content_id"]}
                    if attachment.get("content_id")
                    else {}
                ),
            }
            for attachment in normalized_attachments
        ]

    response = requests.post(
        SENDGRID_API_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=15,
    )
    if response.status_code not in {200, 202}:
        raise ValueError(f"SendGrid send failed: {response.text}")

    return 1


def _get_microsoft_graph_access_token():
    tenant_id = os.getenv("MICROSOFT_GRAPH_TENANT_ID")
    client_id = os.getenv("MICROSOFT_GRAPH_CLIENT_ID")
    client_secret = os.getenv("MICROSOFT_GRAPH_CLIENT_SECRET")

    if not tenant_id or not client_id or not client_secret:
        raise ValueError("Microsoft Graph credentials are not configured.")

    token_response = requests.post(
        f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token",
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "scope": GRAPH_SCOPE,
            "grant_type": "client_credentials",
        },
        timeout=15,
    )
    if token_response.status_code != 200:
        raise ValueError(f"Microsoft Graph token request failed: {token_response.text}")

    payload = token_response.json()
    access_token = payload.get("access_token")
    if not access_token:
        raise ValueError("Microsoft Graph token response did not include an access token.")

    return access_token


def _send_via_microsoft_graph(to_email, subject, body, email_preset, attachments=None, html=False):
    sender_email = email_preset.get("sender_email") or settings.DEFAULT_FROM_EMAIL
    access_token = _get_microsoft_graph_access_token()

    message = {
        "subject": subject,
        "body": {
            "contentType": "HTML" if html else "Text",
            "content": body,
        },
        "toRecipients": [{"emailAddress": {"address": to_email}}],
    }

    reply_to_email = email_preset.get("reply_to_email")
    if reply_to_email:
        message["replyTo"] = [{"emailAddress": {"address": reply_to_email}}]

    normalized_attachments = _normalize_attachments(attachments)
    if normalized_attachments:
        message["attachments"] = [
            {
                "@odata.type": "#microsoft.graph.fileAttachment",
                "name": attachment["filename"],
                "contentType": attachment["mimetype"],
                "contentBytes": base64.b64encode(attachment["content"]).decode("ascii"),
                "isInline": attachment.get("disposition") == "inline",
                **(
                    {"contentId": attachment["content_id"]}
                    if attachment.get("content_id")
                    else {}
                ),
            }
            for attachment in normalized_attachments
        ]

    response = requests.post(
        f"https://graph.microsoft.com/v1.0/users/{sender_email}/sendMail",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        json={
            "message": message,
            "saveToSentItems": True,
        },
        timeout=15,
    )
    if response.status_code not in {200, 202}:
        raise ValueError(f"Microsoft Graph send failed: {response.text}")

    return 1


def _send_email(to_email, subject, body, email_preset, attachments=None, html=False):
    delivery_mode = email_preset.get("delivery_mode", "SMTP")

    if delivery_mode == "SENDGRID_API":
        try:
            return _send_via_sendgrid(
                to_email=to_email,
                subject=subject,
                body=body,
                email_preset=email_preset,
                attachments=attachments,
                html=html,
            )
        except Exception:
            logger.exception(
                "SendGrid delivery failed; falling back to SMTP for %s.",
                to_email,
            )
            return _send_via_smtp(
                to_email=to_email,
                subject=subject,
                body=body,
                email_preset=email_preset,
                attachments=attachments,
                html=html,
            )

    if delivery_mode == "MICROSOFT_GRAPH":
        try:
            return _send_via_microsoft_graph(
                to_email=to_email,
                subject=subject,
                body=body,
                email_preset=email_preset,
                attachments=attachments,
                html=html,
            )
        except Exception:
            logger.exception(
                "Microsoft Graph delivery failed; falling back to SMTP for %s.",
                to_email,
            )
            return _send_via_smtp(
                to_email=to_email,
                subject=subject,
                body=body,
                email_preset=email_preset,
                attachments=attachments,
                html=html,
            )

    return _send_via_smtp(
        to_email=to_email,
        subject=subject,
        body=body,
        email_preset=email_preset,
        attachments=attachments,
        html=html,
    )


def send_basic_email(to_email, subject, body, attachments=None):
    email_preset = _get_email_preset()
    return _send_email(
        to_email=to_email,
        subject=subject,
        body=body,
        email_preset=email_preset,
        attachments=attachments,
    )


def send_template_email(to_email, subject, template_name, context, attachments=None):
    email_preset = _get_email_preset()
    html_body = render_to_string(
        template_name,
        _build_template_context(context, email_preset),
    )
    email_attachments = [_load_logo_attachment(), *(attachments or [])]
    return _send_email(
        to_email=to_email,
        subject=subject,
        body=html_body,
        email_preset=email_preset,
        attachments=email_attachments,
        html=True,
    )


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
        template_name="password_reset.html",
        context={
            "first_name": user.firstname,
            "reset_url": reset_url,
        },
    )


def send_case_status_update_email(passenger, case_id, case_status, note=""):
    email_preset = _get_email_preset()
    status_labels = {
        "ELIGIBLE": "Eligible",
        "NON_ELIGIBLE": "Non-Eligible",
        "AWAITING_DOCUMENTS": "Awaiting Documents",
    }
    status_label = status_labels.get(
        case_status, case_status.replace("_", " ").title())
    placeholder_values = {
        "case_number": case_id,
        "passenger_name": f"{passenger.first_name} {passenger.last_name}".strip(),
        "flight_number": "",
        "organisation_name": email_preset.get("sender_name") or "AirAssist Team",
        "departure_airport": "",
        "arrival_airport": "",
    }
    preset_subject = _render_preset_template(
        email_preset.get("subject_template", "Case Status Update"),
        placeholder_values,
    )
    preset_message = _render_preset_template(
        email_preset.get("body_template", ""),
        placeholder_values,
    )

    return send_template_email(
        to_email=passenger.email,
        subject=preset_subject,
        template_name="case_status_update.html",
        context={
            "first_name": passenger.first_name,
            "case_id": case_id,
            "case_status": status_label,
            "note": note,
            "preset_message": preset_message,
        },
    )
