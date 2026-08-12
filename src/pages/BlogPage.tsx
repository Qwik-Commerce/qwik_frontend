import { useLocation } from "react-router-dom";
import ComingSoonPage from "../components/layout/ComingSoonPage";
import SeoHead from "../components/seo/SeoHead";
import { buildCanonicalUrl } from "../lib/seoCanonical";

export default function BlogPage() {
  const location = useLocation();

  return (
    <>
      <SeoHead
        title="Blog | Qwik"
        description="Stories, tips, and marketplace updates from Qwik."
        canonicalUrl={buildCanonicalUrl(location.pathname, location.search)}
      />
      <ComingSoonPage title="Blog" description="Stories, tips, and marketplace updates from Qwik.NG are coming soon." />
    </>
  );
}
