import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormHelperText,
  Typography,
} from "@mui/material";
import {
  ArrowBack,
  BadgeOutlined,
  CloudUploadOutlined,
  DescriptionOutlined,
} from "@mui/icons-material";
import type {
  DocumentUploadData,
  DocumentUploadErrors,
  DocumentUploadField,
} from "../types/wizardTypes";
import {
  isDocumentUploadDataValid,
  validateDocumentFile,
} from "../utils/documentUploadStepValidation";

interface DocumentUploadStepProps {
  data: DocumentUploadData;
  onChange: (data: DocumentUploadData) => void;
  onBack?: () => void;
  onNext?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function DocumentUploadStep({
  data,
  onChange,
  onBack,
  onNext,
}: DocumentUploadStepProps) {
  const [touched, setTouched] = useState<
    Partial<Record<DocumentUploadField, boolean>>
  >({});

  const errors: DocumentUploadErrors = useMemo(() => {
    const nextErrors: DocumentUploadErrors = {};

    if (touched.boardingPass) {
      const boardingPassError = validateDocumentFile(data.boardingPass);
      if (boardingPassError) {
        nextErrors.boardingPass = boardingPassError;
      }
    }

    if (touched.identityDocument) {
      const identityDocumentError = validateDocumentFile(data.identityDocument);
      if (identityDocumentError) {
        nextErrors.identityDocument = identityDocumentError;
      }
    }

    return nextErrors;
  }, [data.boardingPass, data.identityDocument, touched]);

  const handleFileChange =
    (field: DocumentUploadField) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      onChange({ ...data, [field]: file });
      setTouched((prev) => ({ ...prev, [field]: true }));
    };

  const markTouched = (field: DocumentUploadField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const uploadField = (
    id: string,
    field: DocumentUploadField,
    label: string,
    description: string,
    icon: React.ReactNode,
  ) => {
    const file = data[field];
    const hasError = !!errors[field];

    return (
      <Box
        sx={{
          border: 1,
          borderColor: hasError ? "error.main" : "divider",
          borderRadius: 2,
          p: 2.5,
          bgcolor: "background.default",
        }}
      >
        <Box
          sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", mb: 2 }}
        >
          {icon}
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {label}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {description}
            </Typography>
          </Box>
        </Box>

        <Button
          component="label"
          variant="outlined"
          startIcon={<CloudUploadOutlined />}
          sx={{ mb: 1.5 }}
        >
          {file ? "Replace File" : "Upload File"}
          <input
            id={id}
            type="file"
            accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg"
            hidden
            onBlur={() => markTouched(field)}
            onChange={handleFileChange(field)}
          />
        </Button>

        {file && (
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {file.name} ({formatFileSize(file.size)})
          </Typography>
        )}

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 0.5 }}
        >
          Accepted: PDF, JPG, JPEG. Maximum size: 5 MB.
        </Typography>

        {hasError && <FormHelperText error>{errors[field]}</FormHelperText>}
      </Box>
    );
  };

  return (
    <Box sx={{ maxWidth: 1220, mx: "auto", px: { xs: 2, md: 4 }, py: 3 }}>
      <Card>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Box sx={{ textAlign: "left", mb: 3 }}>
            <Typography variant="h2" sx={{ mb: 1 }}>
              Upload Supporting Documents
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "0.875rem" }}
            >
              Please upload both required documents so we can validate your
              compensation case and continue with the claim process.
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gap: 2.5 }}>
            {uploadField(
              "boarding-pass-upload",
              "boardingPass",
              "Boarding Pass",
              "Upload a clear photo or PDF of your boarding pass.",
              <DescriptionOutlined
                sx={{ color: "text.secondary", fontSize: 24, mt: 0.25 }}
              />,
            )}

            {uploadField(
              "identity-document-upload",
              "identityDocument",
              "ID Card or Passport",
              "Upload your government-issued identification document.",
              <BadgeOutlined
                sx={{ color: "text.secondary", fontSize: 24, mt: 0.25 }}
              />,
            )}
          </Box>
        </CardContent>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            px: { xs: 2, md: 4 },
            py: 2,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={onBack}>
            Back
          </Button>
          <Button
            variant="contained"
            endIcon={<span>→</span>}
            onClick={() => {
              setTouched({ boardingPass: true, identityDocument: true });
              if (isDocumentUploadDataValid(data)) {
                onNext?.();
              }
            }}
          >
            Next
          </Button>
        </Box>
      </Card>
    </Box>
  );
}

export default DocumentUploadStep;
