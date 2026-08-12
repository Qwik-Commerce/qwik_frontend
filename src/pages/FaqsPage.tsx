import { useLocation } from "react-router-dom";
import ComingSoonPage from "../components/layout/ComingSoonPage";
import SeoHead from "../components/seo/SeoHead";
import { buildCanonicalUrl } from "../lib/seoCanonical";

export default function FaqsPage() {
  const location = useLocation();

  return (
    <>
      <SeoHead
        title="FAQs | Qwik"
        description="Answers to common questions about buying, selling, and staying safe on Qwik."
        canonicalUrl={buildCanonicalUrl(location.pathname, location.search)}
      />
      <ComingSoonPage title="FAQs" description="Answers to common questions about buying, selling, and safety are coming soon." />
    </>
  );
}
