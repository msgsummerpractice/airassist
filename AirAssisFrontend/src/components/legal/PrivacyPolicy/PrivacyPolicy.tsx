import LegalPageLayout from "../shared/LegalPageLayout";

function PrivacyPolicy() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated="19 August 2026"
      intro="AIR-ASSIST.EU ('we', 'us') respects your privacy and is committed to protecting the personal data you share with us when you use our flight disruption compensation service."
      sections={[
        {
          heading: "1. Data we collect",
          body: "We collect the information you provide when submitting a case, including your name, contact details, booking reference, flight details, and any supporting documents you upload.",
        },
        {
          heading: "2. How we use your data",
          body: "Your data is used to assess your compensation claim, communicate with you about your case, and, where necessary, correspond with airlines on your behalf.",
        },
        {
          heading: "3. Data sharing",
          body: "We share your data only with the airline involved in your case and, where applicable, legal partners assisting with claim enforcement. We do not sell your personal data to third parties.",
        },
        {
          heading: "4. Data retention",
          body: "We retain your data for as long as necessary to process your claim and to comply with our legal obligations, after which it is securely deleted.",
        },
        {
          heading: "5. Your rights",
          body: "Under the GDPR, you have the right to access, correct, or request deletion of your personal data. Contact us at privacy@air-assist.eu to exercise these rights.",
        },
      ]}
    />
  );
}

export default PrivacyPolicy;
