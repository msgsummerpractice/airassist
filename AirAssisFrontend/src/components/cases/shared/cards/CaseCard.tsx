import type { ReactNode } from "react";
import { Card, CardContent, Stack, Typography } from "@mui/material";

type CaseCardProps = {
  icon?: ReactNode;
  title: string;
  headerAction?: ReactNode;
  children: ReactNode;
};

function CaseCard({ icon, title, headerAction, children }: CaseCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{
            alignItems: { sm: "center" },
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            {icon}
            <Typography variant="h5">{title}</Typography>
          </Stack>
          {headerAction}
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

export default CaseCard;
