import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import FlightTakeoffOutlinedIcon from "@mui/icons-material/FlightTakeoffOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import {
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useState, type ReactNode } from "react";
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
  onLogoClick?: () => void;
};

const getAvatarIcon = (roleLabel: string) => {
  if (roleLabel === "System Administrator") {
    return <AdminPanelSettingsOutlinedIcon fontSize="small" />;
  }

  if (roleLabel === "Colleague") {
    return <BadgeOutlinedIcon fontSize="small" />;
  }

  if (roleLabel === "Passenger") {
    return <FlightTakeoffOutlinedIcon fontSize="small" />;
  }

  return <PersonOutlineOutlinedIcon fontSize="small" />;
};

function PortalUserHeader({
  title = "AIR-ASSIST.EU",
  name,
  email,
  roleLabel,
  actions,
  authAction,
  logoutAction,
  onLogoClick,
}: PortalUserHeaderProps) {
  const accountAction = logoutAction ?? authAction;
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
      return;
    }
    navigate(getHomeRouteForCurrentUser());
  };

  const handleDrawerAction = (onClick: () => void) => {
    setDrawerOpen(false);
    onClick();
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
              xs: "auto 1fr auto",
              lg: "minmax(180px, 220px) minmax(0, 1fr) auto",
            },
            gap: { xs: 1.5, lg: 3 },
            alignItems: "center",
            width: "100%",
          }}
        >
          <IconButton
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            sx={{
              display: { xs: "inline-flex", lg: "none" },
              color: "text.primary",
            }}
          >
            <MenuOutlinedIcon />
          </IconButton>

          <Stack spacing={0.25} sx={{ order: { xs: 0, lg: -1 } }}>
            <Box
              component="img"
              src="/logo-airassist.png"
              alt={title}
              onClick={handleLogoClick}
              sx={{
                display: "block",
                width: { xs: 130, md: 175, lg: 190 },
                maxWidth: "100%",
                height: "auto",
                objectFit: "contain",
                objectPosition: "left center",
                cursor: "pointer",
                mx: { xs: "auto", lg: 0 },
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
              display: { xs: "none", lg: "flex" },
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
              justifySelf: { xs: "end", lg: "end" },
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: "center", display: { xs: "none", sm: "flex" } }}
            >
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
            </Stack>

            <Avatar
              sx={{
                width: 42,
                height: 42,
                bgcolor: "rgba(0, 49, 120, 0.08)",
                color: "primary.main",
              }}
            >
              {getAvatarIcon(roleLabel)}
            </Avatar>

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
                  display: { xs: "none", lg: "inline-flex" },
                }}
              >
                {accountAction.label}
              </Button>
            ) : null}
          </Stack>
        </Box>
      </Box>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { width: 280 } } }}
      >
        <Stack sx={{ height: "100%" }}>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ p: 2, alignItems: "center" }}
          >
            <Avatar
              sx={{
                width: 42,
                height: 42,
                bgcolor: "rgba(0, 49, 120, 0.08)",
                color: "primary.main",
              }}
            >
              {getAvatarIcon(roleLabel)}
            </Avatar>
            <Stack spacing={0.15} sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {email}
              </Typography>
            </Stack>
            <IconButton
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation menu"
              size="small"
            >
              <CloseOutlinedIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Divider />

          <Stack spacing={0.5} sx={{ p: 1.5, flex: 1 }}>
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.active ? "contained" : "text"}
                color={action.active ? "primary" : "inherit"}
                startIcon={action.icon}
                onClick={() => handleDrawerAction(action.onClick)}
                fullWidth
                sx={{
                  justifyContent: "flex-start",
                  minHeight: 44,
                  color: action.active
                    ? "primary.contrastText"
                    : "text.primary",
                }}
              >
                {action.label}
              </Button>
            ))}
          </Stack>

          {accountAction ? (
            <>
              <Divider />
              <Stack sx={{ p: 1.5 }}>
                <Button
                  variant="text"
                  color="inherit"
                  startIcon={accountAction.icon}
                  onClick={() => handleDrawerAction(accountAction.onClick)}
                  fullWidth
                  sx={{
                    justifyContent: "flex-start",
                    minHeight: 44,
                    color: "text.primary",
                  }}
                >
                  {accountAction.label}
                </Button>
              </Stack>
            </>
          ) : null}
        </Stack>
      </Drawer>
    </Box>
  );
}

export type { PortalUserHeaderAction };
export default PortalUserHeader;
