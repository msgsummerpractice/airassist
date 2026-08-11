import "./App.css";
import Login from "./components/login/login";
import FlightItineraryStep from "./components/wizard/steps/FlightItineraryStep";

function App() {
  return (
    <>
      <div>
        <FlightItineraryStep />
        <Login />
      </div>
    </>
  );
}
export default App;
