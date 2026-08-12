import { useLocation } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import SeoHead from "../components/seo/SeoHead";
import { buildCanonicalUrl } from "../lib/seoCanonical";

export default function SupportPage() {
  const location = useLocation();
  const faqs = [
    {
      question: "How do I stay safe when buying?",
      answer: "Meet in a public place, inspect the item before payment, and prefer verified sellers when possible.",
    },
    {
      question: "How do I report suspicious activity?",
      answer: "Use in-app reporting options and contact support with listing links or screenshots so we can act quickly.",
    },
    {
      question: "How do I become a verified seller?",
      answer: "Open Get Verified from your account settings, submit required documents, and complete the review flow.",
    },
    {
      question: "Why was my listing removed?",
      answer: "Listings may be removed for policy violations, suspicious content, or incomplete details. Update and repost if needed.",
    },
  ];

  return (
    <PageLayout contentClassName="mx-auto w-full max-w-[1728px] px-4 pb-16 pt-8 sm:px-6 lg:px-12 lg:pb-24 lg:pt-10">
      <SeoHead
        title="Help & Support | Qwik"
        description="Get help with your Qwik account, listings, and safety questions. Contact support or browse FAQs."
        canonicalUrl={buildCanonicalUrl(location.pathname, location.search)}
      />
      <section className="rounded-[26px] border border-[#eceaf1] bg-[linear-gradient(180deg,#fff9f0_0%,#ffffff_100%)] px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <p className="text-[15px] font-semibold uppercase tracking-[0.08em] text-[#f08a1d]">Help and Support</p>
        <h1 className="mt-3 text-[34px] font-semibold leading-[1.1] text-[#1f1d27] sm:text-[44px]">Need Help With Qwik?</h1>
        <p className="mt-4 max-w-[780px] text-[16px] leading-[1.65] text-[#5f5a68]">
          Get quick answers, safety guidance, and direct support options to keep your buying and selling experience smooth.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-[18px] border border-[#eee9df] bg-white p-5">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#f08a1d]">Email Support</p>
            <p className="mt-2 text-[18px] font-semibold text-[#1f1d27]">help@qwik.ng</p>
            <p className="mt-2 text-[14px] text-[#6d6876]">Best for account and listing issues.</p>
          </div>
          <div className="rounded-[18px] border border-[#eee9df] bg-white p-5">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#f08a1d]">Safety Team</p>
            <p className="mt-2 text-[18px] font-semibold text-[#1f1d27]">Fast Abuse Review</p>
            <p className="mt-2 text-[14px] text-[#6d6876]">Report scams, impersonation, or suspicious listings.</p>
          </div>
          <div className="rounded-[18px] border border-[#eee9df] bg-white p-5 sm:col-span-2 lg:col-span-1">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#f08a1d]">Response Time</p>
            <p className="mt-2 text-[18px] font-semibold text-[#1f1d27]">Usually within 24 hours</p>
            <p className="mt-2 text-[14px] text-[#6d6876]">Most urgent safety reports are prioritized.</p>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-[24px] border border-[#eceaf1] bg-white px-6 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        <h2 className="text-[26px] font-semibold text-[#1f1d27] sm:text-[30px]">Frequently Asked Questions</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {faqs.map((item) => (
            <article key={item.question} className="rounded-[16px] bg-[#f9f7fb] px-4 py-4 sm:px-5">
              <h3 className="text-[16px] font-semibold text-[#1f1d27]">{item.question}</h3>
              <p className="mt-2 text-[14px] leading-[1.6] text-[#605b69]">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
