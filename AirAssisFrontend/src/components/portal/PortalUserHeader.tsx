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
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "stretch", md: "center" },
          }}
        >
          <Stack spacing={0.25}>
            <Typography variant="h2" sx={{ color: "primary.main" }}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {roleLabel}
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={2}
            sx={{ alignItems: { xs: "stretch", lg: "center" } }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ flexWrap: "wrap" }}
            >
              {authAction ? (
                <Button
                  key={authAction.label}
                  variant={authAction.active ? "contained" : "text"}
                  color={authAction.active ? "primary" : "inherit"}
                  startIcon={authAction.icon}
                  onClick={authAction.onClick}
                  sx={{
                    minHeight: 42,
                    px: 2,
                    justifyContent: "center",
                    color: authAction.active
                      ? "primary.contrastText"
                      : "text.primary",
                  }}
                >
                  {authAction.label}
                </Button>
              ) : null}

              {actions.map((action) => (
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

            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: "center",
                pl: { lg: 1 },
              }}
            >
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
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

export type { PortalUserHeaderAction };
export default PortalUserHeader;