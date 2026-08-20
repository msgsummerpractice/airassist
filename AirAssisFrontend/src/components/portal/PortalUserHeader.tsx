import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { getHomeRouteForCurrentUser } from "../../utils/auth";

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
  actions,
  authAction,
  logoutAction,
}: PortalUserHeaderProps) {
  const accountAction = logoutAction ?? authAction;
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate(getHomeRouteForCurrentUser());
  };

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
          width: "100%",
          px: { xs: 2, md: 5 },
          py: { xs: 2, md: 2.5 },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(180px, 220px) minmax(0, 1fr) auto",
            },
            gap: { xs: 2, lg: 3 },
            alignItems: "center",
            width: "100%",
          }}
        >
          <Stack spacing={0.25}>
            <Box
              component="img"
              src="/logo-airassist.png"
              alt={title}
              onClick={handleLogoClick}
              sx={{
                display: "block",
                width: { xs: 150, md: 175, lg: 190 },
                maxWidth: "100%",
                height: "auto",
                objectFit: "contain",
                objectPosition: "left center",
                cursor: "pointer",
              }}
            />
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1.5, md: 3 }}
            sx={{
              width: "100%",
              flexWrap: "wrap",
              justifyContent: {
                xs: "center",
                lg: "center",
              },
              alignItems: "center",
              px: { lg: 3 },
            }}
          >
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.active ? "contained" : "text"}
                color={action.active ? "primary" : "inherit"}
                startIcon={action.icon}
                onClick={action.onClick}
                sx={{
                  minHeight: 40,
                  px: { xs: 1.5, md: 2.25 },
                  minWidth: 0,
                  justifyContent: "center",
                  color: action.active
                    ? "primary.contrastText"
                    : "text.primary",
                  whiteSpace: "nowrap",
                }}
              >
                {action.label}
              </Button>
            ))}
          </Stack>

          <Stack
            direction="row"
            spacing={{ xs: 1.5, md: 2 }}
            sx={{
              justifySelf: { xs: "stretch", lg: "end" },
              justifyContent: { xs: "space-between", sm: "flex-end" },
              alignItems: "center",
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Stack spacing={0.15} sx={{ textAlign: "right", minWidth: 0 }}>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {name}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    maxWidth: { md: 180, lg: 220 },
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
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

            {accountAction ? (
              <Button
                key={accountAction.label}
                variant={accountAction.active ? "contained" : "text"}
                color={accountAction.active ? "primary" : "inherit"}
                startIcon={accountAction.icon}
                onClick={accountAction.onClick}
                sx={{
                  minHeight: 40,
                  px: { xs: 1.5, md: 2 },
                  justifyContent: "center",
                  color: accountAction.active
                    ? "primary.contrastText"
                    : "text.primary",
                  whiteSpace: "nowrap",
                }}
              >
                {accountAction.label}
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
