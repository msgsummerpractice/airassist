import LegalPageLayout from "../shared/LegalPageLayout";

function Imprint() {
  return (
    <LegalPageLayout
      title="Imprint"
      lastUpdated="19 August 2026"
      intro="Information according to legal requirements (Impressum)."
      sections={[
        {
          heading: "Service provider",
          body: "AIR-ASSIST.EU is operated as a passenger rights assistance service within the European Union.",
        },
        {
          heading: "Contact",
          body: "Email: contact@air-assist.eu",
        },
        {
          heading: "Responsible for content",
          body: "The AIR-ASSIST.EU team is responsible for the content of this website in accordance with applicable media law.",
        },
        {
          heading: "Dispute resolution",
          body: "The European Commission provides a platform for online dispute resolution (ODR), available at ec.europa.eu/consumers/odr. We are not obliged to participate in dispute resolution proceedings before a consumer arbitration board.",
        },
      ]}
    />
  );
}

export default Imprint;
