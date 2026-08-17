import logging

from django.db import transaction

from case.models.case import Case


logger = logging.getLogger(__name__)


class CaseDeletionService:
    @staticmethod
    def delete_case(case_id):
        with transaction.atomic():
            case = Case.objects.select_for_update().get(pk=case_id)
            document_files = [
                (document.file.storage, document.file.name)
                for document in case.documents.exclude(file="")
            ]

            case.delete()
            transaction.on_commit(
                lambda: CaseDeletionService._delete_document_files(document_files)
            )

    @staticmethod
    def _delete_document_files(document_files):
        for storage, file_name in document_files:
            try:
                storage.delete(file_name)
            except Exception:
                logger.exception("Could not delete case document file %s.", file_name)