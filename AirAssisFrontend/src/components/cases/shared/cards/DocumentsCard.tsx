import { useState } from "react";
import {
  Alert,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";

import { SECTION_ICON_COLOR } from "../../constants";
import type { CaseDocument } from "../../types";
import { fetchWithAuth } from "../../../../utils/auth";
import CaseCard from "./CaseCard";

type DocumentsCardProps = {
  documents: CaseDocument[];
  formatDateTime: (value: string | null | undefined) => string;
};

function DocumentsCard({ documents, formatDateTime }: DocumentsCardProps) {
  const [downloadError, setDownloadError] = useState("");
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<number | null>(null);

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

  const handleDownload = async (document: CaseDocument) => {
    if (!document.download_url) {
      return;
    }

    setDownloadError("");
    setDownloadingDocumentId(document.id);

    try {
      const response = await fetchWithAuth(document.download_url);

      if (!response.ok) {
        throw new Error("Could not download document.");
      }

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
    } catch (error) {
      setDownloadError(
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
      {downloadError ? <Alert severity="error" sx={{ mb: 2 }}>{downloadError}</Alert> : null}
      {documents.length === 0 ? (
        <Typography color="text.secondary">No documents attached.</Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Filename</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Upload Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    {document.download_url ? (
                      <Link
                        component="button"
                        type="button"
                        underline="hover"
                        color="primary"
                        onClick={() => void handleDownload(document)}
                        disabled={downloadingDocumentId === document.id}
                      >
                        {downloadingDocumentId === document.id
                          ? `Downloading ${document.filename}...`
                          : document.filename}
                      </Link>
                    ) : (
                      document.filename
                    )}
                  </TableCell>
                  <TableCell>{document.document_type}</TableCell>
                  <TableCell>{formatDateTime(document.uploaded_at)}</TableCell>
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
