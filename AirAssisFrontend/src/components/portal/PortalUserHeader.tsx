import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type PortalUserHeaderAction = {
  label: string;
  onClick: () => void;
  active?: boolean;
  icon?: ReactNode;
};

type PortalUserHeaderProps = {
  title?: string;
  name: string;
  email: string;
  roleLabel: string;
  actions: PortalUserHeaderAction[];
  authAction?: PortalUserHeaderAction;
  logoutAction?: PortalUserHeaderAction;
};

const getAvatarLabel = (name: string) => {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "G";
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
};

function PortalUserHeader({
  title = "AIR-ASSIST.EU",
  name,
  email,
  roleLabel,
  actions,
  authAction,
  logoutAction,
}: PortalUserHeaderProps) {
  const navigationActions = [
    ...(authAction ? [authAction] : []),
    ...actions,
  ].sort(
    (firstAction, secondAction) =>
      Number(Boolean(secondAction.active)) -
      Number(Boolean(firstAction.active)),
  );

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        width: "100%",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid",
        borderColor: "divider",
        boxShadow: "0 6px 20px rgba(18, 28, 42, 0.04)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Box
        sx={{
          maxWidth: 1220,
          mx: "auto",
          px: { xs: 2, md: 4 },
          py: 2,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1fr) auto minmax(0, 1fr)",
            },
            gap: 2,
            alignItems: "center",
          }}
        >
          <Stack spacing={0.25} sx={{ justifySelf: { lg: "start" } }}>
            <Typography variant="h2" sx={{ color: "primary.main" }}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {roleLabel}
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {navigationActions.map((action) => (
              <Button
                key={action.label}
                variant={action.active ? "contained" : "text"}
                color={action.active ? "primary" : "inherit"}
                startIcon={action.icon}
                onClick={action.onClick}
                sx={{
                  minHeight: 42,
                  px: 2,
                  justifyContent: "center",
                  color: action.active
                    ? "primary.contrastText"
                    : "text.primary",
                }}
              >
                {action.label}
              </Button>
            ))}
          </Stack>

          <Stack
            direction="row"
            spacing={2}
            sx={{
              justifySelf: { xs: "stretch", lg: "end" },
              justifyContent: { xs: "space-between", sm: "flex-end" },
              alignItems: "center",
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Stack spacing={0.15} sx={{ textAlign: "right" }}>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {email}
                </Typography>
              </Stack>

              <Avatar
                sx={{
                  width: 42,
                  height: 42,
                  bgcolor: "rgba(0, 49, 120, 0.08)",
                  color: "primary.main",
                }}
              >
                {name === "Guest" ? (
                  <PersonOutlineOutlinedIcon fontSize="small" />
                ) : (
                  getAvatarLabel(name)
                )}
              </Avatar>
            </Stack>

            {logoutAction ? (
              <Button
                key={logoutAction.label}
                variant={logoutAction.active ? "contained" : "text"}
                color={logoutAction.active ? "primary" : "inherit"}
                startIcon={logoutAction.icon}
                onClick={logoutAction.onClick}
                sx={{
                  minHeight: 42,
                  px: 2,
                  justifyContent: "center",
                  color: logoutAction.active
                    ? "primary.contrastText"
                    : "text.primary",
                }}
              >
                {logoutAction.label}
              </Button>
            ) : null}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

export type { PortalUserHeaderAction };
export default PortalUserHeader;
