from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from user.permissions import IsPassenger

from ..models.case import Case
from ..serializers.passenger_case_comment_serializer import (
	PassengerCaseCommentCreateSerializer,
	PassengerCaseCommentSerializer,
)
from ..services.case_conversation_service import CaseConversationService


class PassengerCaseCommentCreateView(generics.CreateAPIView):
	serializer_class = PassengerCaseCommentCreateSerializer
	permission_classes = [IsAuthenticated, IsPassenger]

	def _get_owned_case(self):
		user_email = self.request.user.email.lower()
		queryset = Case.objects.filter(passengers__email__iexact=user_email).distinct()
		return get_object_or_404(queryset, pk=self.kwargs["pk"])

	def create(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		case = self._get_owned_case()
		CaseConversationService.ensure_open(case)
		comment = serializer.save(case=case, author=request.user)

		response_serializer = PassengerCaseCommentSerializer(comment)
		return Response(response_serializer.data, status=status.HTTP_201_CREATED)
