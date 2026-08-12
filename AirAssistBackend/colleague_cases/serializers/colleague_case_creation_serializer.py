from case.serializers.case_creation_serializer import CaseCreationSerializer

from ..services.colleague_case_creation_service import ColleagueCaseCreationService


class ColleagueCaseCreationSerializer(CaseCreationSerializer):
    def _validate_upload(self, value, field_name):
        return self.validate_upload(value, field_name)

    def create(self, validated_data):
        return ColleagueCaseCreationService.create_case(validated_data)