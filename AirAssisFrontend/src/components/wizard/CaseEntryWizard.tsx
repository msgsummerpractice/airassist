import {useState} from "react";
import PassangersStep from "./steps/PassangersStep";
import { EMPTY_PASSENGER } from "./types/wizardTypes";
import type { PassengerData } from "./types/wizardTypes";


function CaseEntryWizard() {
    const [passengerData, setPassengerData] = useState<PassengerData>(EMPTY_PASSENGER);

    return (
     <PassangersStep
        data={passengerData}
        onChange={setPassengerData}
     />
    );
}

export default CaseEntryWizard;
