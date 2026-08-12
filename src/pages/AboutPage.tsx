import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import { ROUTES } from "../constants/routes";
import SeoHead from "../components/seo/SeoHead";
import { buildCanonicalUrl } from "../lib/seoCanonical";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ShieldIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 5 6v6c0 5 3.4 8.8 7 10 3.6-1.2 7-5 7-10V6l-7-3Z" />
      <path d="m9.6 12.1 1.7 1.8 3.7-4" />
    </svg>
  );
}

function CheckBadgeIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 5 6v6c0 5 3.4 8.8 7 10 3.6-1.2 7-5 7-10V6l-7-3Z" />
      <path d="m9.6 12.1 1.7 1.8 3.7-4" />
    </svg>
  );
}

function FlashIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M13.2 2 6.8 12h4.4L10.8 22 17.2 12h-4.4L13.2 2Z" />
    </svg>
  );
}

function PinIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H7" />
    </svg>
  );
}

function TrustCard({
  title,
  description,
  icon,
  iconClass,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  iconClass: string;
}) {
  return (
    <article className="rounded-[22px] border border-[#eceaf1] bg-white px-5 py-6 shadow-[0_12px_28px_rgba(17,12,46,0.05)] sm:px-6">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${iconClass}`}>{icon}</div>
      <h3 className="text-[18px] font-semibold text-[#1f1d27]">{title}</h3>
      <p className="mt-2 text-[14px] leading-[1.6] text-[#6e6b75]">{description}</p>
    </article>
  );
}

function StepsList({ items }: { items: Array<{ title: string; description: string }> }) {
  return (
    <div className="space-y-3.5 text-left">
      {items.map((item, index) => (
        <div key={item.title} className="rounded-[14px] border border-[#efecef] bg-white px-4 py-3">
          <p className="text-[14px] font-semibold text-[#f08a1d]">{index + 1}. {item.title}</p>
          <p className="mt-1 text-[14px] leading-[1.55] text-[#5c5865]">{item.description}</p>
        </div>
      ))}
    </div>
  );
}

function StatsStrip() {
  return (
    <section className="mt-14 rounded-[24px] border border-[#f0edf3] bg-white px-4 py-5 shadow-[0_14px_34px_rgba(17,12,46,0.05)] sm:px-6 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[16px] bg-[#fff6eb] px-4 py-4">
          <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#8d8697]">Active Users</p>
          <p className="mt-2 text-[30px] font-semibold leading-none text-[#1f1d27]">10M+</p>
        </div>
        <div className="rounded-[16px] bg-[#fff6eb] px-4 py-4">
          <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#8d8697]">Listings Posted</p>
          <p className="mt-2 text-[30px] font-semibold leading-none text-[#1f1d27]">5M+</p>
        </div>
        <div className="rounded-[16px] bg-[#fff6eb] px-4 py-4">
          <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#8d8697]">Cities Reached</p>
          <p className="mt-2 text-[30px] font-semibold leading-none text-[#1f1d27]">250+</p>
        </div>
        <div className="rounded-[16px] bg-[#fff6eb] px-4 py-4">
          <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#8d8697]">Daily Connections</p>
          <p className="mt-2 text-[30px] font-semibold leading-none text-[#1f1d27]">100K+</p>
        </div>
      </div>
    </section>
  );
}

function SafetyItem({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[16px] bg-white/75 px-4 py-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff4e6] text-[#f08a1d]">{icon}</span>
        <div>
          <p className="text-[15px] font-semibold text-[#1f1d27]">{title}</p>
          <p className="mt-1 text-[14px] leading-[1.55] text-[#625d67]">{description}</p>
        </div>
      </div>
    </div>
  );
}

function UserCircleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.3" />
      <path d="M5.2 19.2c1.6-3.1 4-4.7 6.8-4.7s5.2 1.6 6.8 4.7" />
    </svg>
  );
}

function TrendUpIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 16 10 10l4 4 6-6" />
      <path d="M15 8h5v5" />
    </svg>
  );
}

function HeadsetIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12a8 8 0 0 1 16 0" />
      <rect x="3" y="11" width="4" height="7" rx="2" />
      <rect x="17" y="11" width="4" height="7" rx="2" />
      <path d="M7 18c0 2.2 1.8 4 4 4h2" />
    </svg>
  );
}

function VerifiedBenefit({
  title,
  icon,
  className = "",
}: {
  title: string;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-h-[66px] min-w-0 items-center gap-3 rounded-[16px] border border-[#eceaf1] bg-white px-3 py-2.5 shadow-[0_10px_24px_rgba(17,12,46,0.08)] ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff3e3] text-[#f08a1d]">{icon}</span>
      <span className="min-w-0 text-[12px] font-medium leading-[1.3] text-[#1f1d27] break-words xl:text-[13px] xl:leading-[1.35]">{title}</span>
    </div>
  );
}

export default function AboutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <PageLayout contentClassName="mx-auto w-full max-w-[1728px] px-4 pb-16 pt-8 sm:px-6 lg:px-12 lg:pb-24 lg:pt-10">
      <SeoHead
        title="About Us | Qwik"
        description="Learn about Qwik, Nigeria's trusted online marketplace connecting buyers and verified sellers nationwide."
        canonicalUrl={buildCanonicalUrl(location.pathname, location.search)}
      />
      <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(340px,540px)] lg:gap-14">
        <div>
          <p className="text-[16px] font-semibold uppercase tracking-[0.08em] text-[#f08a1d]">About Qwik.NG</p>
          <h1 className="mt-4 max-w-[700px] text-[35px] font-semibold leading-[1.08] text-[#1f1d27] sm:text-[48px] lg:text-[60px]">
            A Marketplace Built For Nigerians, By Nigerians.
          </h1>
          <p className="mt-5 max-w-[700px] text-[17px] leading-[1.65] text-[#5c5865]">
            Qwik.NG provides a trusted platform where Nigerians can buy and sell with confidence,
            connect with verified sellers, and reach customers nationwide.
          </p>
          <p className="mt-3 max-w-[700px] text-[15px] leading-[1.7] text-[#7b7683]">
            We are on a mission to empower everyday Nigerians to buy and sell with ease, whether it is
            a car, fashion item, home appliance, or camera.
          </p>
          <button
            className="mt-8 inline-flex h-[50px] items-center gap-2 rounded-[14px] bg-gradient-to-r from-amber to-orange px-6 text-[15px] font-medium text-white shadow-glow"
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
          >
            <span>Explore Marketplace</span>
            <ArrowIcon />
          </button>
        </div>
        <div className="overflow-hidden rounded-[28px] border border-[#efeaf3] bg-[linear-gradient(180deg,#fff9f0_0%,#ffffff_100%)] p-4 sm:p-6">
          <img src="/about-images/first-about-image.PNG" alt="Qwik marketplace hero" className="h-full w-full object-contain" />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-center text-[30px] font-semibold text-[#1f1d27] sm:text-[40px]">
          Why Millions Trust <span className="text-[#f08a1d]">Qwik.NG</span>
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <TrustCard
            title="Secure Trading"
            description="Safety tools and moderation make every trade more reliable."
            iconClass="bg-[#fff3e3] text-[#f08a1d]"
            icon={<ShieldIcon className="h-5 w-5" />}
          />
          <TrustCard
            title="Verified Sellers"
            description="Buyers can identify trusted sellers more quickly."
            iconClass="bg-[#eaf9ef] text-[#23b45a]"
            icon={<CheckBadgeIcon className="h-5 w-5" />}
          />
          <TrustCard
            title="Fast Listing"
            description="Post an advert in minutes and start reaching customers."
            iconClass="bg-[#f5eefe] text-[#a855f7]"
            icon={<FlashIcon className="h-5 w-5" />}
          />
          <TrustCard
            title="Nationwide Reach"
            description="Connect with buyers and sellers across Nigeria."
            iconClass="bg-[#ffecee] text-[#ef4444]"
            icon={<PinIcon className="h-5 w-5" />}
          />
        </div>
      </section>

      <StatsStrip />

      <section className="mt-16 grid items-center gap-10 lg:grid-cols-[minmax(300px,520px)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-[28px] border border-[#efeaf3] bg-[linear-gradient(180deg,#fff9f0_0%,#ffffff_100%)] p-4 sm:p-6">
          <img src="/about-images/second-about-image.PNG" alt="How to sell on Qwik" className="h-full w-full object-contain" />
        </div>
        <div>
          <h2 className="text-[32px] font-semibold text-[#1f1d27] sm:text-[40px]">
            Want to Sell on <span className="text-[#f08a1d]">Qwik.NG</span>
          </h2>
          <div className="mt-6 max-w-[640px]">
            <StepsList
              items={[
                {
                  title: "Register",
                  description: "Create your account using your email and phone number.",
                },
                {
                  title: "Take photos of your items",
                  description: "Upload clear photos and accurate details for faster buyer decisions.",
                },
                {
                  title: "Click on Post an Ad",
                  description: "Submit your listing and wait for a quick review before it goes live.",
                },
                {
                  title: "Respond to clients through chats",
                  description: "Close deals faster by replying quickly and clearly to buyers.",
                },
              ]}
            />
          </div>
          <button
            className="mt-8 inline-flex h-[48px] items-center gap-2 rounded-[14px] bg-gradient-to-r from-amber to-orange px-6 text-[15px] font-medium text-white shadow-glow"
            type="button"
            onClick={() => navigate(ROUTES.PROMOTE_AD)}
          >
            <span>Sell</span>
            <ArrowIcon />
          </button>
        </div>
      </section>

      <section className="mt-16 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(300px,520px)]">
        <div>
          <h2 className="text-[32px] font-semibold text-[#1f1d27] sm:text-[40px]">
            Want to Buy on <span className="text-[#f08a1d]">Qwik.NG</span>
          </h2>
          <div className="mt-6 max-w-[640px]">
            <StepsList
              items={[
                {
                  title: "Search for item",
                  description: "Browse categories and use filters to find exactly what you need.",
                },
                {
                  title: "Contact the seller",
                  description: "Use chat to ask questions and confirm product details.",
                },
                {
                  title: "Pay",
                  description: "After agreement, complete payment and arrange delivery or pickup.",
                },
                {
                  title: "Leave a review",
                  description: "Share your experience to help other buyers make informed choices.",
                },
              ]}
            />
          </div>
          <button
            className="mt-8 inline-flex h-[48px] items-center gap-2 rounded-[14px] bg-gradient-to-r from-amber to-orange px-6 text-[15px] font-medium text-white shadow-glow"
            type="button"
            onClick={() => navigate(ROUTES.SEARCH_RESULTS)}
          >
            <span>Go Shopping</span>
            <ArrowIcon />
          </button>
        </div>
        <div className="overflow-hidden rounded-[28px] border border-[#efeaf3] bg-[linear-gradient(180deg,#fff9f0_0%,#ffffff_100%)] p-4 sm:p-6">
          <img src="/about-images/third-about-image.PNG" alt="How to buy on Qwik" className="h-full w-full object-contain" />
        </div>
      </section>

      <section className="mt-16 rounded-[30px] bg-[#fff1db] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <h2 className="text-center text-[30px] font-semibold text-[#1f1d27] sm:text-[40px]">
          Your <span className="text-[#f08a1d]">Safety</span> Comes First
        </h2>
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
          <div className="flex justify-center lg:justify-start">
            <div className="relative flex h-[220px] w-[220px] items-center justify-center rounded-full bg-[#ffd7a8] sm:h-[250px] sm:w-[250px]">
              <div className="absolute inset-[18px] rounded-full bg-[#ffc785]" />
              <div className="relative flex h-[120px] w-[120px] items-center justify-center rounded-full bg-[#f08a1d] text-white sm:h-[136px] sm:w-[136px]">
                <ShieldIcon className="h-14 w-14 sm:h-16 sm:w-16" />
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SafetyItem
              title="Meet Safely"
              description="Always choose secure public locations whenever possible."
              icon={<PinIcon className="h-5 w-5" />}
            />
            <SafetyItem
              title="Verify Sellers"
              description="Prefer verified sellers and inspect items before payment."
              icon={<CheckBadgeIcon className="h-5 w-5" />}
            />
            <SafetyItem
              title="Secure Communication"
              description="Keep conversations and agreements inside the platform chat."
              icon={<ShieldIcon className="h-5 w-5" />}
            />
            <SafetyItem
              title="Report Fast"
              description="Report suspicious activity immediately for quick support."
              icon={<FlashIcon className="h-5 w-5" />}
            />
          </div>
        </div>
      </section>

      <section className="mt-16 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,540px)]">
        <div>
          <h2 className="text-[32px] font-semibold text-[#1f1d27] sm:text-[40px]">Want to be a Verified Seller?</h2>
          <div className="mt-6 max-w-[640px]">
            <StepsList
              items={[
                {
                  title: "Click on Get Verified",
                  description: "Open the verification flow to begin your trusted seller journey.",
                },
                {
                  title: "Submit your documents",
                  description: "Provide your business details, CAC certificate, NIN, and requested records.",
                },
                {
                  title: "Proceed to payment",
                  description: "Complete the one-time verification payment for review.",
                },
                {
                  title: "Get your badge",
                  description: "Earn stronger trust, better visibility, and priority support once approved.",
                },
              ]}
            />
          </div>
          <button
            className="mt-8 inline-flex h-[48px] items-center gap-2 rounded-[14px] bg-gradient-to-r from-amber to-orange px-6 text-[15px] font-medium text-white shadow-glow"
            type="button"
            onClick={() => navigate(ROUTES.GET_VERIFIED)}
          >
            <span>Get Verified</span>
            <ArrowIcon />
          </button>
        </div>
        <div className="relative overflow-hidden rounded-[28px] border border-[#efeaf3] bg-[linear-gradient(180deg,#fff9f0_0%,#ffffff_100%)] p-4 sm:p-6">
          <div className="grid gap-4 lg:hidden">
            <div className="mx-auto w-full max-w-[300px]">
              <img src="/about-images/verify-logo.PNG" alt="Verified seller logo" className="h-auto w-full object-contain" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <VerifiedBenefit title="Verified Seller Badge" icon={<ShieldIcon className="h-4 w-4" />} />
              <VerifiedBenefit title="Increased Customer Trust" icon={<UserCircleIcon className="h-4 w-4" />} />
              <VerifiedBenefit title="Priority Support" icon={<HeadsetIcon className="h-4 w-4" />} />
              <VerifiedBenefit title="Higher Search Visibility" icon={<TrendUpIcon className="h-4 w-4" />} />
            </div>
          </div>

          <div className="hidden items-center gap-3 lg:grid lg:grid-cols-[minmax(120px,1fr)_minmax(180px,220px)_minmax(120px,1fr)]">
            <div className="grid min-w-0 gap-4">
              <VerifiedBenefit title="Verified Seller Badge" icon={<ShieldIcon className="h-4 w-4" />} className="w-full" />
              <VerifiedBenefit title="Priority Support" icon={<HeadsetIcon className="h-4 w-4" />} className="w-full" />
            </div>

            <div className="mx-auto w-full max-w-[220px]">
              <img src="/about-images/verify-logo.PNG" alt="Verified seller logo" className="h-auto w-full object-contain" />
            </div>

            <div className="grid min-w-0 gap-4">
              <VerifiedBenefit title="Increased Customer Trust" icon={<UserCircleIcon className="h-4 w-4" />} className="w-full" />
              <VerifiedBenefit title="Higher Search Visibility" icon={<TrendUpIcon className="h-4 w-4" />} className="w-full" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-20 rounded-[28px] bg-[#fff1db] px-6 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-[720px] text-center">
          <div className="mx-auto flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white text-[#ff7f1f] shadow-sm">
            <CartIcon />
          </div>
          <h2 className="mt-5 text-[28px] font-medium text-[#1f1d27] sm:text-[34px]">
            Built to make buying and selling feel faster, safer, and more local.
          </h2>
          <p className="mt-4 text-[15px] leading-[1.65] text-[#6b6671]">
            Qwik.NG helps Nigerians discover products, connect with real people, and grow businesses with trusted marketplace tools.
          </p>
        </div>
      </section>
    </PageLayout>
  );
}
