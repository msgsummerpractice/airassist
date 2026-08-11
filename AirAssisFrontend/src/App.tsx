import "./App.css";
import { Typography, Button } from "@mui/material";

function App() {
  return (
    <>
      <div style={{ padding: 32 }}>
        <Typography variant="h1">Reliable Claims Navigator</Typography>
        <Typography variant="body1">Theme check</Typography>
        <Button variant="contained">Primary Button</Button>
        <Button variant="outlined" sx={{ ml: 2 }}>
          Back
        </Button>
      </div>
    </>
  );
}

export default App;
