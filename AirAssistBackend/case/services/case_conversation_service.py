from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from ..custom_exceptions.exceptions import BadRequestAPIException
from ..enums.conversation_status_enum import ConversationStatus
from ..models.case import Case


class CaseConversationService:
    @staticmethod
    def _get_assigned_case(case_id, colleague):
        case = get_object_or_404(Case, pk=case_id)

        if case.assigned_colleague_id != colleague.id:
            raise PermissionDenied(
                "Only the colleague assigned to this case can manage its conversation."
            )

        return case

    @staticmethod
    def close_conversation(case_id, colleague):
        case = CaseConversationService._get_assigned_case(case_id, colleague)

        if case.conversation_status == ConversationStatus.CLOSED.value:
            raise BadRequestAPIException("Conversation is already closed.")

        case.conversation_status = ConversationStatus.CLOSED.value
        case.conversation_closed_at = timezone.now()
        case.conversation_closed_by = colleague
        case.save(
            update_fields=[
                "conversation_status",
                "conversation_closed_at",
                "conversation_closed_by",
                "updated_at",
            ]
        )
        return case

    @staticmethod
    def reopen_conversation(case_id, colleague):
        case = CaseConversationService._get_assigned_case(case_id, colleague)

        if case.conversation_status == ConversationStatus.OPEN.value:
            raise BadRequestAPIException("Conversation is already open.")

        case.conversation_status = ConversationStatus.OPEN.value
        case.conversation_closed_at = None
        case.conversation_closed_by = None
        case.save(
            update_fields=[
                "conversation_status",
                "conversation_closed_at",
                "conversation_closed_by",
                "updated_at",
            ]
        )
        return case

    @staticmethod
    def ensure_open(case):
        if case.conversation_status == ConversationStatus.CLOSED.value:
            raise PermissionDenied(
                "This conversation is closed and cannot receive new comments."
            )
