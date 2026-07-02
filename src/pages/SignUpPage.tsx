import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { persistLegalConsentFromUser, setAcceptedLegalConsentSnapshot, setRole, setToken } from "../services/auth";
import { clearUserCache } from "../hooks/useUserCache";
import AuthLayout from "../components/layout/AuthLayout";
import FormInput from "../components/ui/FormInput";
import FormButton from "../components/ui/FormButton";
import LegalConsentModal, { type LegalDocumentType } from "../components/auth/LegalConsentModal";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";

const LEGAL_CONSENT_VERSION = "2026-06-09";

function EyeToggleIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M1.5 12s3.5-6.5 10.5-6.5S22.5 12 22.5 12 19 18.5 12 18.5 1.5 12 1.5 12Z" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3 21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.6 5.8A11.68 11.68 0 0 1 12 5.5C19 5.5 22.5 12 22.5 12a21.84 21.84 0 0 1-3.44 4.47" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6.3 8.11A22.2 22.2 0 0 0 1.5 12S5 18.5 12 18.5c1.3 0 2.49-.22 3.57-.58" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.88 9.87A3.2 3.2 0 0 0 12 15.2c.47 0 .92-.1 1.32-.28" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PasswordRule({ met, text }: { met: boolean; text: string }) {
  return (
    <li className={`flex items-center gap-2 text-[12px] ${met ? "text-[#1f7742]" : "text-[#8a8792]"}`}>
      <span
        aria-hidden="true"
        className={`inline-flex h-[16px] w-[16px] items-center justify-center rounded-full text-[10px] font-semibold ${met ? "bg-[#d9f4e3] text-[#1f7742]" : "bg-[#ece8df] text-[#8a8792]"}`}
      >
        {met ? "✓" : "•"}
      </span>
      {text}
    </li>
  );
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const { error: showError, success } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalDocumentType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fullName = useMemo(() => `${firstName} ${lastName}`.trim().replace(/\s+/g, " "), [firstName, lastName]);
  const isPhoneValid = useMemo(() => /^\+?\d{10,15}$/.test(phone.replace(/\s/g, "")), [phone]);
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canCreate = fullName.trim().length >= 2 && /\S+@\S+\.\S+/.test(email) && isPhoneValid && password.length >= 8 && passwordsMatch && acceptedLegal;

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Start your Qwik journey in less than a minute."
      onLogoClick={() => navigate("/")}
      topPromptText="Already have an account?"
      topPromptActionText="Login"
      onTopPromptActionClick={() => navigate(ROUTES.LOGIN)}
      cardClassName="max-w-[560px]"
    >
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormInput
          id="signup-first-name"
          label="First Name"
          aria-label="First name"
          type="text"
          autoComplete="given-name"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          containerClassName="mb-0"
        />
        <FormInput
          id="signup-last-name"
          label="Last Name"
          aria-label="Last name"
          type="text"
          autoComplete="family-name"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          containerClassName="mb-0"
        />
      </div>

      <FormInput
        id="signup-email"
        label="Email"
        aria-label="Email"
        autoComplete="email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <FormInput
        id="signup-phone"
        label="Phone"
        aria-label="Phone"
        autoComplete="tel"
        type="tel"
        placeholder="+2348012345678"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <FormInput
        id="signup-password"
        label="Password"
        aria-label="Password"
        autoComplete="new-password"
        type={showPassword ? "text" : "password"}
        placeholder="Create password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        containerClassName="mb-2"
        rightAdornment={(
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((prev) => !prev)}
            className="rounded-md p-1.5 text-[#7b7882] transition-colors hover:text-[#2f2c36] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357]"
          >
            <EyeToggleIcon visible={showPassword} />
          </button>
        )}
      />

      <FormInput
        id="signup-confirm-password"
        label="Confirm Password"
        aria-label="Confirm password"
        autoComplete="new-password"
        type={showConfirmPassword ? "text" : "password"}
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        containerClassName="mb-2"
        error={confirmPassword.length > 0 && !passwordsMatch ? "Passwords do not match" : undefined}
        rightAdornment={(
          <button
            type="button"
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="rounded-md p-1.5 text-[#7b7882] transition-colors hover:text-[#2f2c36] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357]"
          >
            <EyeToggleIcon visible={showConfirmPassword} />
          </button>
        )}
      />

      <ul className="mb-4 grid grid-cols-1 gap-1.5 rounded-[12px] bg-[#f8f5ef] p-3">
        <PasswordRule met={hasMinLength} text="At least 8 characters" />
        <PasswordRule met={hasUppercase} text="One uppercase letter" />
        <PasswordRule met={hasLowercase} text="One lowercase letter" />
        <PasswordRule met={hasNumber} text="One number" />
        <PasswordRule met={hasSpecial} text="One special character" />
      </ul>

      <label className="mb-5 flex items-start gap-2.5 text-[12px] leading-[1.45] text-[#6f6d78]">
        <input
          type="checkbox"
          checked={acceptedLegal}
          onChange={(e) => setAcceptedLegal(e.target.checked)}
          className="mt-[2px] h-[16px] w-[16px] shrink-0 rounded-[4px] border border-[#acabb6] bg-transparent accent-[#ff8f00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        />
        <span>
          I agree to the{" "}
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
        disabled={!canCreate || isSubmitting}
        buttonClassName={`h-[52px] rounded-[14px] text-[15px] font-semibold ${canCreate && !isSubmitting ? "bg-gradient-to-r from-amber to-orange text-white shadow-glow hover:opacity-95" : ""}`}
        onClick={async () => {
          try {
            setIsSubmitting(true);
            const res = await api.register({
              email: email.trim().toLowerCase(),
              password,
              fullName: fullName.trim(),
              phone: phone.trim(),
              termsAccepted: true,
              privacyAccepted: true,
              termsVersion: LEGAL_CONSENT_VERSION,
              privacyVersion: LEGAL_CONSENT_VERSION,
            });
            setToken(res.data.token);
            setRole(res.data.user.role);
            setAcceptedLegalConsentSnapshot(true);
            persistLegalConsentFromUser(res.data.user);
            clearUserCache(); // Clear cache for new user
            success("Account created successfully");
            // Redirect to email verification if email not verified, otherwise to welcome
            const isEmailVerified = res.data.user.emailVerifiedAt !== null && res.data.user.emailVerifiedAt !== undefined;
            navigate(isEmailVerified ? "/welcome" : "/verify-email");
          } catch (error) {
            showError(error instanceof Error ? error.message : "Sign up failed");
          } finally {
            setIsSubmitting(false);
          }
        }}
        isLoading={isSubmitting}
        loadingText="Creating..."
      >
        Create Account
      </FormButton>

      <div className="mb-4 mt-6 flex items-center gap-3 text-[#7b7882]">
        <span className="h-px flex-1 bg-[#ded8cf]" />
        <span className="text-[11px] font-semibold tracking-[0.08em]">OR CONTINUE WITH</span>
        <span className="h-px flex-1 bg-[#ded8cf]" />
      </div>

      <GoogleSignInButton
        requiresLegalConsent
        hasAcceptedLegal={acceptedLegal}
        onLegalConsentRequired={() => showError("Please accept the Terms of Use and Privacy Policy to continue.")}
      />

      <p className="text-center text-[13px] text-[#7a7884]">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => navigate(ROUTES.LOGIN)}
          className="font-semibold text-[#ff8f00] transition-colors hover:text-[#e67f00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2"
        >
          Login
        </button>
      </p>

      <LegalConsentModal documentType={legalModal} onClose={() => setLegalModal(null)} onAgree={() => setAcceptedLegal(true)} />
    </AuthLayout>
  );
}
