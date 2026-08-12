import {useState} from "react";
import PassangersStep from "./steps/PassangersStep";
import { EMPTY_PASSENGER } from "./types/wizardTypes";
import type { PassengerData } from "./types/wizardTypes";
import Toolbar from "@mui/material/Toolbar";
import GDPRStep from "./steps/GDPRStep";
import DocumentUploadStep from "./steps/DocumentUploadStep";


function CaseEntryWizard() {
    const [passengerData, setPassengerData] = useState<PassengerData>(EMPTY_PASSENGER);
    const [gdprData, setGdprData] = useState({ email: "", gdprConsent: false });
    const [documentUploadData, setDocumentUploadData] = useState<{ boardingPass: File | null; identityDocument: File | null }>({
        boardingPass: null,
        identityDocument: null,
    });

    return (
        <div>
            <PassangersStep
                data={passengerData}
                onChange={setPassengerData}
            />

            <Toolbar />

            <GDPRStep
                data={gdprData}
                onChange={setGdprData}
            />

            <Toolbar />

            <DocumentUploadStep
                data={documentUploadData}
                onChange={setDocumentUploadData}
            />
        </div>
     
    );
}

export default CaseEntryWizard;
