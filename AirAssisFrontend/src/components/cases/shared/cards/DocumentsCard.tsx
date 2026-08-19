import { useState } from "react";
import {
  Alert,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";

import { SECTION_ICON_COLOR } from "../../constants";
import { downloadCaseDocument, uploadCaseDocument } from "../../api";
import type { CaseDocument } from "../../types";
import { ACCESS_TOKEN_STORAGE_KEY } from "../../constants";
import { validateDocumentFile } from "../../../wizard/utils/documentUploadStepValidation";
import CaseCard from "./CaseCard";

const DOCUMENT_TYPE_OPTIONS = ["BOARDING_PASS", "PASSPORT", "CONTRACT"];

type DocumentsCardProps = {
  caseId: number;
  documents: CaseDocument[];
  formatDateTime: (value: string | null | undefined) => string;
  canManageDocuments?: boolean;
  onDocumentUploaded?: () => Promise<void> | void;
  onUploadSuccess?: (message: string) => void;
  onDownloadSuccess?: (message: string) => void;
  onUnauthorized?: () => void;
};

function DocumentsCard({
  caseId,
  documents,
  formatDateTime,
  canManageDocuments = false,
  onDocumentUploaded,
  onUploadSuccess,
  onDownloadSuccess,
  onUnauthorized,
}: DocumentsCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("CONTRACT");
  const [uploadError, setUploadError] = useState("");
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<
    number | null
  >(null);
  const [isUploading, setIsUploading] = useState(false);

  const parseDownloadFilename = (
    contentDisposition: string | null,
    fallbackFilename: string,
  ) => {
    if (!contentDisposition) {
      return fallbackFilename;
    }

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1]);
    }

    const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
    if (quotedMatch?.[1]) {
      return quotedMatch[1];
    }

    const bareMatch = contentDisposition.match(/filename=([^;]+)/i);
    if (bareMatch?.[1]) {
      return bareMatch[1].trim();
    }

    return fallbackFilename;
  };

  const getAccessToken = () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (!accessToken) {
      onUnauthorized?.();
      throw new Error("Unauthorized.");
    }
    return accessToken;
  };

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    setUploadError(file ? validateDocumentFile(file) : "");
  };

  const handleUpload = async () => {
    const validationError = validateDocumentFile(selectedFile);
    if (validationError || !selectedFile) {
      setUploadError(validationError);
      return;
    }

    setUploadError("");
    setIsUploading(true);

    try {
      const payload = await uploadCaseDocument({
        caseId,
        file: selectedFile,
        documentType,
        accessToken: getAccessToken(),
      });

      setSelectedFile(null);
      await onDocumentUploaded?.();
      onUploadSuccess?.(payload.message || "Document uploaded successfully.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not upload document.";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (document: CaseDocument) => {
    if (!canManageDocuments) {
      return;
    }

    setDownloadingDocumentId(document.id);

    try {
      const response = await downloadCaseDocument({
        caseId,
        documentId: document.id,
        accessToken: getAccessToken(),
      });

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = downloadUrl;
      link.download = parseDownloadFilename(
        response.headers.get("Content-Disposition"),
        document.filename,
      );
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      onDownloadSuccess?.("Document downloaded successfully.");
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Could not download document.",
      );
    } finally {
      setDownloadingDocumentId(null);
    }
  };

  return (
    <CaseCard
      icon={<DescriptionOutlined sx={{ color: SECTION_ICON_COLOR }} />}
      title="Attached Documents List"
    >
      {canManageDocuments && (
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ mb: 2, alignItems: { md: "center" } }}
        >
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFileOutlined />}
            disabled={isUploading}
          >
            {selectedFile ? selectedFile.name : "Choose Document"}
            <input
              hidden
              type="file"
              accept="application/pdf,image/jpeg,.pdf,.jpg,.jpeg"
              onChange={(event) => {
                handleFileChange(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
          </Button>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="document-type-label">Document Type</InputLabel>
            <Select
              labelId="document-type-label"
              label="Document Type"
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
            >
              {DOCUMENT_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={() => void handleUpload()}
            disabled={!selectedFile || Boolean(uploadError) || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </Stack>
      )}
      {uploadError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {uploadError}
        </Alert>
      ) : null}
      {documents.length === 0 ? (
        <Typography color="text.secondary">No documents attached.</Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Filename</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Uploaded by</TableCell>
                <TableCell>Upload Timestamp</TableCell>
                {canManageDocuments && (
                  <TableCell align="right">Action</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    {canManageDocuments ? (
                      <Link
                        component="button"
                        type="button"
                        underline="hover"
                        color="primary"
                        onClick={() => void handleDownload(document)}
                        disabled={downloadingDocumentId === document.id}
                      >
                        {document.filename}
                      </Link>
                    ) : (
                      document.filename
                    )}
                  </TableCell>
                  <TableCell>{document.document_type}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={
                        document.uploaded_by === "PASSENGER"
                          ? "Passenger"
                          : document.uploaded_by === "COLLEAGUE"
                            ? "Colleague"
                            : "Unknown"
                      }
                      sx={{
                        backgroundColor:
                          document.uploaded_by === "PASSENGER"
                            ? "rgba(27, 109, 36, 0.10)"
                            : document.uploaded_by === "COLLEAGUE"
                              ? "rgba(0, 49, 120, 0.10)"
                              : "transparent",
                        color:
                          document.uploaded_by === "PASSENGER"
                            ? "rgb(27, 109, 36)"
                            : document.uploaded_by === "COLLEAGUE"
                              ? "rgb(0, 49, 120)"
                              : "text.secondary",
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(document.uploaded_at)}</TableCell>
                  {canManageDocuments && (
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<DownloadOutlined />}
                        onClick={() => void handleDownload(document)}
                        disabled={downloadingDocumentId === document.id}
                      >
                        {downloadingDocumentId === document.id
                          ? "Downloading..."
                          : "Download"}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </CaseCard>
  );
}

export default DocumentsCard;
