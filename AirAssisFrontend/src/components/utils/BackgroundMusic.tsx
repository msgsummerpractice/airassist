import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { IconButton, Tooltip } from "@mui/material";
import { useRef, useState } from "react";

const BACKGROUND_MUSIC_URL = "/videoplayback.mp3";

function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const label = isPlaying ? "Pause background music" : "Play background music";

  return (
    <>
      <audio
        ref={audioRef}
        loop
        preload="metadata"
        src={BACKGROUND_MUSIC_URL}
      />
      <Tooltip title={label}>
        <IconButton
          aria-label={label}
          color="primary"
          onClick={togglePlayback}
          sx={(theme) => ({
            position: "fixed",
            right: { xs: 16, md: 24 },
            bottom: { xs: 16, md: 24 },
            zIndex: theme.zIndex.tooltip,
            width: 44,
            height: 44,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[2],
            "&:hover": {
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
            },
          })}
        >
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          {!isPlaying && (
            <VolumeUpIcon
              sx={{
                position: "absolute",
                right: 4,
                bottom: 4,
                fontSize: 12,
              }}
            />
          )}
        </IconButton>
      </Tooltip>
    </>
  );
}

export default BackgroundMusic;
