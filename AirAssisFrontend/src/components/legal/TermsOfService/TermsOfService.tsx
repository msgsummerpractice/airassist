import LegalPageLayout from "../shared/LegalPageLayout";

function TermsOfService() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated="19 August 2026"
      intro="These Terms of Service govern your use of AIR-ASSIST.EU. By submitting a case through our platform, you agree to the terms below."
      sections={[
        {
          heading: "1. Our service",
          body: "AIR-ASSIST.EU helps passengers assess and pursue compensation claims for flight delays, cancellations, and denied boarding under EU Regulation 261/2004.",
        },
        {
          heading: "2. Eligibility assessment",
          body: "We review the information you submit to determine whether your case is likely eligible for compensation. An eligibility decision is not a guarantee of payment by the airline.",
        },
        {
          heading: "3. Fees",
          body: "Unless otherwise agreed, our fee is a percentage of the compensation successfully recovered on your behalf. No fee is charged if your claim is unsuccessful.",
        },
        {
          heading: "4. Your responsibilities",
          body: "You agree to provide accurate and complete information and to notify us promptly of any changes to your case, including direct contact from the airline.",
        },
        {
          heading: "5. Limitation of liability",
          body: "We act as an intermediary to help process your claim. We are not liable for an airline's refusal to pay compensation where such refusal is lawful under applicable regulation.",
        },
      ]}
    />
  );
}

export default TermsOfService;
