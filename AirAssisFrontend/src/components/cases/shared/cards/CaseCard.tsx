import type { ReactNode } from "react";
import { Card, CardContent, Stack, Typography } from "@mui/material";

type CaseCardProps = {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
};

function CaseCard({ icon, title, children }: CaseCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
          {icon}
          <Typography variant="h5">{title}</Typography>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

export default CaseCard;
