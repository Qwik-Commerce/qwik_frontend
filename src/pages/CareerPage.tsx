import { useLocation } from "react-router-dom";
import ComingSoonPage from "../components/layout/ComingSoonPage";
import SeoHead from "../components/seo/SeoHead";
import { buildCanonicalUrl } from "../lib/seoCanonical";

export default function CareerPage() {
  const location = useLocation();

  return (
    <>
      <SeoHead
        title="Careers | Qwik"
        description="Explore career opportunities to build and grow with Qwik."
        canonicalUrl={buildCanonicalUrl(location.pathname, location.search)}
      />
      <ComingSoonPage title="Career" description="We will share opportunities to build and grow with Qwik.NG here soon." />
    </>
  );
}
