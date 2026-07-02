import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout";
import FormInput from "../components/ui/FormInput";
import FormButton from "../components/ui/FormButton";
import { hasAcceptedLegalConsentSnapshot, setAcceptedLegalConsentSnapshot, setLoginEmail } from "../services/auth";
import LegalConsentModal, { type LegalDocumentType } from "../components/auth/LegalConsentModal";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(() => hasAcceptedLegalConsentSnapshot());
  const [legalModal, setLegalModal] = useState<LegalDocumentType | null>(null);
  const canContinue = /\S+@\S+\.\S+/.test(email) && acceptedLegal;

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Log in to continue buying and selling on Qwik."
      onLogoClick={() => navigate("/")}
      topPromptText="Don't have an account?"
      topPromptActionText="Sign Up"
      onTopPromptActionClick={() => navigate("/signup")}
      cardClassName="max-w-[520px]"
    >
      <FormInput
        id="login-email"
        label="Email"
        aria-label="Email"
        autoComplete="email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        containerClassName="mb-4"
      />

      <label className="mb-5 flex items-start gap-2.5 text-[12px] leading-[1.45] text-[#6f6d78]">
        <input
          type="checkbox"
          checked={acceptedLegal}
          onChange={(e) => {
            setAcceptedLegal(e.target.checked);
            setAcceptedLegalConsentSnapshot(e.target.checked);
          }}
          className="mt-[2px] h-[16px] w-[16px] shrink-0 rounded-[4px] border border-[#acabb6] bg-transparent accent-[#ff8f00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        />
        <span>
          I confirm and accept the{" "}
          <button
            type="button"
            onClick={() => setLegalModal("terms")}
            className="font-medium text-[#ff8f00] underline-offset-2 transition-colors hover:text-[#e67f00] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Terms of Use
          </button>{" "}
          and{" "}
          <button
            type="button"
            onClick={() => setLegalModal("privacy")}
            className="font-medium text-[#ff8f00] underline-offset-2 transition-colors hover:text-[#e67f00] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Privacy Policy
          </button>
        </span>
      </label>

      <FormButton
        disabled={!canContinue}
        buttonClassName={`h-[52px] rounded-[14px] text-[15px] font-semibold ${canContinue ? "bg-gradient-to-r from-amber to-orange text-white shadow-glow hover:opacity-95" : ""}`}
        onClick={() => {
          setLoginEmail(email.trim().toLowerCase());
          navigate("/login-password");
        }}
      >
        Continue
      </FormButton>

      <div className="mb-4 mt-6 flex items-center gap-3 text-[#7b7882]">
        <span className="h-px flex-1 bg-[#ded8cf]" />
        <span className="text-[11px] font-semibold tracking-[0.08em]">OR CONTINUE WITH</span>
        <span className="h-px flex-1 bg-[#ded8cf]" />
      </div>

      <GoogleSignInButton
        requiresLegalConsent
        hasAcceptedLegal={acceptedLegal}
      />

      <p className="text-center text-[13px] text-[#7a7884]">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => navigate("/signup")}
          className="font-semibold text-[#ff8f00] transition-colors hover:text-[#e67f00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2"
        >
          Sign Up
        </button>
      </p>

      <LegalConsentModal
        documentType={legalModal}
        onClose={() => setLegalModal(null)}
        onAgree={() => {
          setAcceptedLegal(true);
          setAcceptedLegalConsentSnapshot(true);
        }}
      />
    </AuthLayout>
  );
}
