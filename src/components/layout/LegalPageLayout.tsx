import { useLocation } from "react-router-dom";
import PageLayout from "./PageLayout";
import SeoHead from "../seo/SeoHead";
import { buildCanonicalUrl } from "../../lib/seoCanonical";

export type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageLayoutProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  intro: string;
  sections: LegalSection[];
};

export default function LegalPageLayout({ eyebrow, title, subtitle, intro, sections }: LegalPageLayoutProps) {
  const location = useLocation();

  return (
    <PageLayout contentClassName="px-4 py-8 sm:px-6 sm:py-12 lg:px-12 lg:py-16">
      <SeoHead
        title={`${title} | Qwik`}
        description={intro.replace(/\s+/g, " ").trim().slice(0, 160)}
        canonicalUrl={buildCanonicalUrl(location.pathname, location.search)}
      />
      <article className="mx-auto max-w-[980px] rounded-[20px] bg-white px-5 py-7 shadow-[0_18px_60px_rgba(31,29,39,0.06)] sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <header className="border-b border-[#ececf0] pb-6 sm:pb-8">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#ff8f00]">{eyebrow}</p>
          <h1 className="text-[30px] font-semibold leading-[1.08] text-[#1f1d27] sm:text-[42px]">{title}</h1>
          <p className="mt-3 text-[16px] font-medium text-[#4b4a54] sm:text-[18px]">{subtitle}</p>
          <p className="mt-5 max-w-[760px] text-[15px] leading-[1.75] text-[#64636d] sm:text-[17px]">{intro}</p>
        </header>

        <div className="mt-7 space-y-7 sm:mt-9 sm:space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-[20px] font-semibold leading-[1.25] text-[#1f1d27] sm:text-[24px]">{section.title}</h2>
              <div className="mt-3 space-y-3 text-[15px] leading-[1.75] text-[#5f5d6c] sm:text-[16px]">
                {section.body.map((paragraph, index) => (
                  <p key={`${section.title}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </PageLayout>
  );
}
