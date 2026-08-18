from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from colleague_cases.permissions import IsColleague

from ..services.case_conversation_service import CaseConversationService


class ColleagueCaseConversationCloseView(APIView):
    permission_classes = [IsAuthenticated, IsColleague]

    def post(self, request, case_id):
        try:
            case = CaseConversationService.close_conversation(case_id, request.user)
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": "Conversation closed successfully.",
                "conversation_status": case.conversation_status,
            },
            status=status.HTTP_200_OK,
        )


class ColleagueCaseConversationReopenView(APIView):
    permission_classes = [IsAuthenticated, IsColleague]

    def post(self, request, case_id):
        try:
            case = CaseConversationService.reopen_conversation(case_id, request.user)
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": "Conversation reopened successfully.",
                "conversation_status": case.conversation_status,
            },
            status=status.HTTP_200_OK,
        )
