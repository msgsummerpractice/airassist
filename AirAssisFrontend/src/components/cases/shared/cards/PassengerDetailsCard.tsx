import { Typography } from "@mui/material";
import PersonOutlineOutlined from "@mui/icons-material/PersonOutlineOutlined";

import { SECTION_ICON_COLOR } from "../../constants";
import type { PassengerDetails } from "../../types";
import CaseCard from "./CaseCard";
import CaseDetailsTable from "./CaseDetailsTable";

type PassengerDetailsCardProps = {
  passenger: PassengerDetails | null;
  formatDate: (value: string | null | undefined) => string;
};

function PassengerDetailsCard({
  passenger,
  formatDate,
}: PassengerDetailsCardProps) {
  return (
    <CaseCard
      icon={<PersonOutlineOutlined sx={{ color: SECTION_ICON_COLOR }} />}
      title="Passenger details"
    >
      {passenger ? (
        <CaseDetailsTable
          rows={[
            ["Name", passenger.first_name],
            ["Family Name", passenger.last_name],
            ["Date of Birth", formatDate(passenger.date_of_birth)],
            ["E-mail", passenger.email],
            ["Phone", passenger.phone ?? "-"],
            ["Address", passenger.address ?? "-"],
            ["Postal Code", passenger.postal_code ?? "-"],
          ]}
        />
      ) : (
        <Typography color="text.secondary">
          Passenger details are not available.
        </Typography>
      )}
    </CaseCard>
  );
}

export default PassengerDetailsCard;
