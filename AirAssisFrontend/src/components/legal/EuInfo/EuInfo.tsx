import {
  EU261_FIRST_THRESHOLD,
  EU261_SECOND_THRESHOLD,
  EU261_SHORT_COMPENSATION,
  EU261_MEDIUM_COMPENSATION,
  EU261_LONG_COMPENSATION,
} from "../../../constants/eu261";
import LegalPageLayout from "../shared/LegalPageLayout";

function EuInfo() {
  return (
    <LegalPageLayout
      title="EU Regulation 261/2004 Info"
      lastUpdated="19 August 2026"
      intro="EU Regulation 261/2004 establishes common rules on compensation and assistance for passengers in the event of denied boarding, flight cancellation, or long delay."
      sections={[
        {
          heading: "Who is covered",
          body: "The regulation applies to flights departing from an EU airport, and to flights arriving in the EU operated by an EU airline, regardless of nationality of the passenger.",
        },
        {
          heading: "Compensation amounts",
          body: `Passengers may be entitled to €${EU261_SHORT_COMPENSATION} for flights up to ${EU261_FIRST_THRESHOLD} km, €${EU261_MEDIUM_COMPENSATION} for flights between ${EU261_FIRST_THRESHOLD} km and ${EU261_SECOND_THRESHOLD} km, and €${EU261_LONG_COMPENSATION} for flights over ${EU261_SECOND_THRESHOLD} km, depending on the delay and distance involved.`,
        },
        {
          heading: "Extraordinary circumstances",
          body: "Airlines are not required to pay compensation if the disruption was caused by extraordinary circumstances beyond their control, such as severe weather or air traffic control restrictions.",
        },
        {
          heading: "Your right to assistance",
          body: "Regardless of compensation eligibility, passengers affected by long delays or cancellations are entitled to care such as meals, refreshments, and accommodation where necessary.",
        },
        {
          heading: "How AIR-ASSIST.EU helps",
          body: "We assess your case against these rules and, where you are entitled to compensation, help you pursue that claim with the airline.",
        },
      ]}
    />
  );
}

export default EuInfo;
