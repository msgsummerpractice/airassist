from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from case.models.case import Case
from case.serializers.passenger_case_comment_serializer import (
    PassengerCaseCommentCreateSerializer,
    PassengerCaseCommentSerializer,
)

from ..permissions import IsColleague


class ColleagueCaseCommentCreateView(generics.CreateAPIView):
    serializer_class = PassengerCaseCommentCreateSerializer
    permission_classes = [IsAuthenticated, IsColleague]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        case = get_object_or_404(Case.objects.all(), pk=self.kwargs["pk"])
        comment = serializer.save(case=case, author=request.user)

        response_serializer = PassengerCaseCommentSerializer(comment)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)