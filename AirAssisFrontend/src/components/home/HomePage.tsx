import { useRef, useState } from "react";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import {
  motion,
  useAnimationControls,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useNavigate } from "react-router-dom";

type HomePageProps = {
  onCreateCase: () => void;
};

const steps = [
  {
    number: "01",
    title: "Tell us about your flight",
    description: "Add your itinerary and the disruption that affected your journey.",
  },
  {
    number: "02",
    title: "Upload your documents",
    description: "Provide the travel documents we need to review your case.",
  },
  {
    number: "03",
    title: "Track your case",
    description: "Create an account or sign in later to follow your claim.",
  },
];

function HomePage({ onCreateCase }: HomePageProps) {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [isPlaneHovered, setIsPlaneHovered] = useState(false);
  const planeProgress = useMotionValue(0);
  const planeSpeed = useRef(1);
  const planeTargetSpeed = useRef(1);
  const planeLoopControls = useAnimationControls();
  const planeX = useTransform(planeProgress, (progress) => Math.cos(progress) * 46);
  const planeY = useTransform(planeProgress, (progress) => Math.sin(progress) * 16);
  const planeRotate = useTransform(
    planeProgress,
    (progress) => Math.sin(progress + Math.PI / 5) * 5
  );

  useAnimationFrame((_, delta) => {
    if (shouldReduceMotion) return;

    planeSpeed.current += (planeTargetSpeed.current - planeSpeed.current) * 0.08;
    planeProgress.set(planeProgress.get() + delta * 0.00135 * planeSpeed.current);
  });

  const handlePlaneClick = async () => {
    if (shouldReduceMotion) {
      await planeLoopControls.start({ scale: [1, 1.08, 1] });
      return;
    }

    await planeLoopControls.start({
      x: [0, 25, 45, 59, 64, 59, 45, 25, 0, -25, -45, -59, -64, -59, -45, -25, 0],
      y: [0, -5, -19, -40, -64, -88, -109, -123, -128, -123, -109, -88, -64, -40, -19, -5, 0],
      rotate: [
        0,
        -23,
        -45,
        -68,
        -90,
        -113,
        -135,
        -158,
        -180,
        -203,
        -225,
        -248,
        -270,
        -293,
        -315,
        -338,
        -360,
      ],
      transition: {
        duration: 1.65,
        ease: "linear",
      },
    });
    planeLoopControls.set({ x: 0, y: 0, rotate: 0 });
  };

  return (
    <Box sx={{ minHeight: "100%", backgroundColor: "#f3f6fc" }}>
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          width: "100%",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid",
          borderColor: "divider",
          boxShadow: "0 6px 20px rgba(18, 28, 42, 0.04)",
          px: { xs: 2, md: 5 },
          py: { xs: 2, md: 2.5 },
        }}
      >
        <Box
          component="img"
          src="/logo-airassist.png"
          alt="AIR-ASSIST.EU"
          onClick={() => navigate("/")}
          sx={{
            display: "block",
            width: { xs: 130, md: 190 },
            maxWidth: "100%",
            height: "auto",
            cursor: "pointer",
          }}
        />
      </Box>

      <Box
        component="main"
        sx={{
          maxWidth: 1280,
          mx: "auto",
          px: { xs: 2, sm: 4, lg: 6 },
          py: { xs: 5, md: 8 },
        }}
      >
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            border: "1px solid",
            borderColor: "rgba(0, 49, 120, 0.16)",
            borderRadius: 3,
            backgroundColor: "#ffffff",
            boxShadow: "0 18px 45px rgba(0, 49, 120, 0.08)",
            px: { xs: 3, md: 7 },
            py: { xs: 4, md: 7 },
            "&::after": {
              content: '""',
              position: "absolute",
              right: { xs: -100, md: -40 },
              top: { xs: -110, md: -150 },
              width: { xs: 260, md: 390 },
              height: { xs: 260, md: 390 },
              borderRadius: "50%",
              backgroundColor: "rgba(232, 240, 255, 0.85)",
              zIndex: 0,
            },
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 4, md: 6 }}
            sx={{ position: "relative", zIndex: 1, alignItems: "center" }}
          >
            <Stack spacing={{ xs: 3, md: 4 }} sx={{ flex: "1 1 58%" }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <ShieldOutlinedIcon sx={{ color: "secondary.main" }} />
                <Typography
                  variant="caption"
                  sx={{ color: "secondary.main", letterSpacing: "0.12em" }}
                >
                  EU PASSENGER SUPPORT
                </Typography>
              </Stack>

              <Stack spacing={2}>
                <Typography
                  component="h1"
                  sx={{
                    color: "primary.main",
                    fontFamily: "Manrope, sans-serif",
                    fontSize: { xs: "2.5rem", md: "4.5rem" },
                    fontWeight: 800,
                    lineHeight: { xs: 1.05, md: 1.02 },
                    maxWidth: 700,
                  }}
                >
                  Your flight disruption deserves a clear next step.
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", maxWidth: 620 }}
                >
                  Start a compensation case with AIR-ASSIST.EU. We help you
                  organize the details, documents, and progress in one place.
                </Typography>
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ alignItems: { xs: "stretch", sm: "center" } }}
              >
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddTaskOutlinedIcon />}
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={onCreateCase}
                  sx={{ minHeight: 48, px: 2.5 }}
                >
                  Create New Case
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<LoginOutlinedIcon />}
                  onClick={() => navigate("/login")}
                  sx={{ minHeight: 48, px: 2.5 }}
                >
                  Log In
                </Button>
              </Stack>
            </Stack>

            <Box
              aria-hidden="true"
              sx={{
                position: "relative",
                flex: "1 1 34%",
                width: "100%",
                minHeight: { xs: 190, md: 280 },
                display: "grid",
                placeItems: "center",
                mt: { md: -3 },
              }}
            >
              <Box
                component={motion.div}
                animate={
                  shouldReduceMotion ? undefined : { opacity: [0.45, 0.75, 0.45] }
                }
                transition={{ duration: 5.8, ease: "easeInOut", repeat: Infinity }}
                sx={{
                  position: "absolute",
                  width: { xs: 180, md: 260 },
                  height: { xs: 180, md: 260 },
                  border: "1px dashed rgba(0, 49, 120, 0.24)",
                  borderRadius: "50%",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  width: { xs: 132, md: 200 },
                  height: { xs: 132, md: 200 },
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.94) 0%, " +
                    "rgba(232,240,255,0.72) 68%, " +
                    "rgba(232,240,255,0.22) 100%)",
                  boxShadow: "inset 0 0 35px rgba(0, 49, 120, 0.08)",
                }}
              />
              {[
                {
                  top: "15%",
                  left: "-20%",
                  width: 92,
                  delay: 0,
                  drift: 122,
                  duration: 9.2,
                },
                {
                  right: "-22%",
                  bottom: "24%",
                  width: 118,
                  delay: 0.45,
                  drift: -138,
                  duration: 10.8,
                },
                {
                  left: "1%",
                  bottom: "7%",
                  width: 72,
                  delay: 0.9,
                  drift: 102,
                  duration: 8.1,
                },
              ].map((cloud) => (
                <Box
                  key={`${cloud.width}-${cloud.delay}`}
                  component={motion.div}
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : {
                          x: [0, cloud.drift, 0],
                          opacity: [0.72, 0.94, 0.72],
                        }
                  }
                  whileHover={
                    shouldReduceMotion
                      ? { scale: 1.06 }
                      : { scale: 1.08, opacity: 1 }
                  }
                  transition={{
                    duration: cloud.duration,
                    delay: cloud.delay,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                  sx={{
                    position: "absolute",
                    top: cloud.top,
                    left: cloud.left,
                    right: cloud.right,
                    bottom: cloud.bottom,
                    width: cloud.width,
                    height: Math.round(cloud.width * 0.46),
                    cursor: "pointer",
                    transformOrigin: "center",
                    filter: "drop-shadow(0 14px 18px rgba(0, 49, 120, 0.18))",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      left: "7%",
                      right: "7%",
                      bottom: "9%",
                      height: "43%",
                      border: "1px solid rgba(0, 49, 120, 0.14)",
                      borderTop: 0,
                      borderRadius: "999px",
                      background:
                        "linear-gradient(180deg, #dbeafe 0%, #b9d7ff 100%)",
                    }}
                  />
                  {[
                    { left: "8%", bottom: "20%", size: "43%" },
                    { left: "32%", bottom: "28%", size: "55%" },
                    { left: "63%", bottom: "20%", size: "39%" },
                  ].map((lobe) => (
                    <Box
                      key={`${lobe.left}-${lobe.size}`}
                      sx={{
                        position: "absolute",
                        left: lobe.left,
                        bottom: lobe.bottom,
                        width: lobe.size,
                        aspectRatio: "1",
                        border: "1px solid rgba(0, 49, 120, 0.14)",
                        borderRadius: "50%",
                        background:
                          "linear-gradient(180deg, #edf5ff 0%, #c8ddfb 100%)",
                      }}
                    />
                  ))}
                  <Box
                    sx={{
                      position: "absolute",
                      left: "18%",
                      right: "18%",
                      bottom: "17%",
                      height: "16%",
                      borderRadius: 999,
                      backgroundColor: "rgba(255, 255, 255, 0.46)",
                    }}
                  />
                </Box>
              ))}
              <Box
                component={motion.div}
                onHoverStart={() => {
                  setIsPlaneHovered(true);
                  planeTargetSpeed.current = 2.65;
                }}
                onHoverEnd={() => {
                  setIsPlaneHovered(false);
                  planeTargetSpeed.current = 1;
                }}
                onClick={handlePlaneClick}
                sx={{
                  position: "relative",
                  width: { xs: 220, md: 310 },
                  height: { xs: 150, md: 210 },
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  overflow: "visible",
                }}
              >
                <Box
                  component={motion.div}
                  animate={{ scale: isPlaneHovered ? 1.08 : 1 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  style={
                    shouldReduceMotion
                      ? undefined
                      : { x: planeX, y: planeY, rotate: planeRotate }
                  }
                  sx={{
                    position: "relative",
                    width: { xs: 158, md: 230 },
                    filter: isPlaneHovered
                      ? "drop-shadow(0 30px 34px rgba(0, 49, 120, 0.32))"
                      : "drop-shadow(0 24px 28px rgba(0, 49, 120, 0.22))",
                    transformOrigin: "center",
                    overflow: "visible",
                    pointerEvents: "none",
                  }}
                >
                  <Box
                    component={motion.div}
                    animate={planeLoopControls}
                    sx={{ position: "relative", width: "100%" }}
                  >
                    {[0, 1, 2].map((line) => (
                      <Box
                        key={line}
                        component={motion.div}
                        animate={
                          shouldReduceMotion
                            ? { opacity: isPlaneHovered ? 0.5 : 0 }
                            : {
                                x: isPlaneHovered ? [-2, -34, -2] : 0,
                                opacity: isPlaneHovered ? [0.08, 0.72, 0.08] : 0,
                              }
                        }
                        transition={{
                          duration: 0.62,
                          delay: line * 0.08,
                          ease: "easeOut",
                          repeat: isPlaneHovered && !shouldReduceMotion ? Infinity : 0,
                        }}
                        sx={{
                          position: "absolute",
                          left: { xs: -34, md: -48 },
                          top: `${30 + line * 18}%`,
                          width: { xs: 52 + line * 10, md: 76 + line * 14 },
                          height: 3,
                          borderRadius: 999,
                          background:
                            "linear-gradient(90deg, rgba(0, 49, 120, 0), " +
                            "rgba(0, 49, 120, 0.32), rgba(53, 174, 226, 0))",
                          pointerEvents: "none",
                        }}
                      />
                    ))}
                    <Box
                      component="img"
                      src="/airplane-sprite.svg"
                      alt=""
                      sx={{ display: "block", width: "100%", height: "auto" }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Stack>
        </Box>

        <Box component="section" sx={{ mt: { xs: 5, md: 7 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 2.5, md: 0 }}
            divider={<Divider flexItem orientation="vertical" />}
            sx={{
              backgroundColor: "#ffffff",
              borderTop: "3px solid",
              borderColor: "secondary.main",
              px: { xs: 2.5, md: 4 },
              py: { xs: 3, md: 3.5 },
            }}
          >
            {steps.map((step) => (
              <Stack
                key={step.number}
                spacing={0.75}
                sx={{ flex: 1, px: { md: 3 }, firstOfType: { pl: 0 } }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: "secondary.main", letterSpacing: "0.08em" }}
                >
                  {step.number}
                </Typography>
                <Typography variant="h2" sx={{ color: "primary.main" }}>
                  {step.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {step.description}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

export default HomePage;
