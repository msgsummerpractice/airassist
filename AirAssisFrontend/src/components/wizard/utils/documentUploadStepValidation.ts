import type { DocumentUploadData } from "../types/wizardTypes";

const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg"];
const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg"];

export function validateDocumentFile(file: File | null): string {
  if (!file) return "This field is required";

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const hasValidMimeType = ALLOWED_MIME_TYPES.includes(file.type);
  const hasValidExtension = ALLOWED_EXTENSIONS.includes(extension);

  if (!hasValidMimeType && !hasValidExtension) {
    return "Only PDF or JPG/JPEG files are allowed";
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return "Maximum file size is 5 MB";
  }

  return "";
}

export function isDocumentUploadDataValid(data: DocumentUploadData): boolean {
  return (
    validateDocumentFile(data.boardingPass) === "" &&
    validateDocumentFile(data.identityDocument) === ""
  );
}
