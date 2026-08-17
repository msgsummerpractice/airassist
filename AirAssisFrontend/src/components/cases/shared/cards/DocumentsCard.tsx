import {
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
import CaseCard from "./CaseCard";

type DocumentsCardProps = {
  documents: CaseDocument[];
  formatDateTime: (value: string | null | undefined) => string;
};

function DocumentsCard({ documents, formatDateTime }: DocumentsCardProps) {
  return (
    <CaseCard
      icon={<DescriptionOutlined sx={{ color: SECTION_ICON_COLOR }} />}
      title="Attached Documents List"
    >
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
                  <TableCell>{document.filename}</TableCell>
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
