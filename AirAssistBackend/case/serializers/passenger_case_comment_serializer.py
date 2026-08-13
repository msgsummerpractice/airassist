from rest_framework import serializers

from ..models.comment import Comment


class PassengerCaseCommentSerializer(serializers.ModelSerializer):
	author_email = serializers.EmailField(source="author.email", read_only=True)
	author_role = serializers.CharField(source="author.role.role", read_only=True)

	class Meta:
		model = Comment
		fields = ["id", "text", "author_email", "author_role", "created_at"]
		read_only_fields = ["id", "author_email", "author_role", "created_at"]


class PassengerCaseCommentCreateSerializer(serializers.ModelSerializer):
	class Meta:
		model = Comment
		fields = ["text"]

	def validate_text(self, value):
		normalized = value.strip()
		if not normalized:
			raise serializers.ValidationError("Comment text cannot be empty.")
		if len(normalized) > 1000:
			raise serializers.ValidationError(
				"Comment text cannot exceed 1000 characters.",
			)
		return normalized
