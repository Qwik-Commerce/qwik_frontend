import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { getLoginEmail, persistLegalConsentFromUser, setRole, setToken } from "../services/auth";
import { clearUserCache } from "../hooks/useUserCache";
import AuthLayout from "../components/layout/AuthLayout";
import FormInput from "../components/ui/FormInput";
import FormCheckbox from "../components/ui/FormCheckbox";
import FormButton from "../components/ui/FormButton";
import { buildVerifyEmailRoute } from "../lib/emailVerification";
import { resolveUserLoginRedirectFromSearch } from "../lib/authRedirect";

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

export default function LoginPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { error: showError } = useToast();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canLogin = password.length >= 6;
  const loginEmail = getLoginEmail();
  const userRedirectTarget = resolveUserLoginRedirectFromSearch(location.search, "/welcome");

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle={loginEmail ? `Continue as ${loginEmail}` : "Enter your password to finish logging in."}
      onLogoClick={() => navigate("/")}
      topPromptText="Need an account?"
      topPromptActionText="Sign Up"
      onTopPromptActionClick={() => navigate("/signup")}
      cardClassName="max-w-[520px]"
    >
      <FormInput
        id="login-password"
        label="Password"
        aria-label="Password"
        type={showPassword ? "text" : "password"}
        placeholder="Enter your password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        containerClassName="mb-[14px]"
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

      <div className="mb-5 flex items-center justify-between gap-3">
        <FormCheckbox
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          label="Remember me"
          containerClassName="text-[12px]"
        />
        <button
          onClick={() => navigate("/recover-password")}
          className="text-[12px] font-medium text-[#6f6d78] transition-colors duration-200 hover:text-[#3a3741] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2"
          type="button"
        >
          Forgot Password?
        </button>
      </div>

      <FormButton
        disabled={!canLogin || isSubmitting}
        buttonClassName="h-[52px] rounded-[14px] text-[15px] font-semibold"
        onClick={async () => {
          try {
            setIsSubmitting(true);
            const email = getLoginEmail();
            if (!email) {
              showError("Please enter your email first.");
              navigate("/login");
              return;
            }
            const res = await api.login({ email, password });
            setToken(res.data.token);
            setRole(res.data.user.role);
            persistLegalConsentFromUser(res.data.user);
            clearUserCache(); // Clear cache on login for new user

            // Normal website login should always continue in user-flow routes.
            const isEmailVerified = res.data.user.emailVerifiedAt !== null && res.data.user.emailVerifiedAt !== undefined;
            navigate(isEmailVerified ? userRedirectTarget : buildVerifyEmailRoute(userRedirectTarget));
          } catch (error) {
            showError(error instanceof Error ? error.message : "Login failed");
          } finally {
            setIsSubmitting(false);
          }
        }}
        isLoading={isSubmitting}
        loadingText="Logging in..."
      >
        Login
      </FormButton>
    </AuthLayout>
  );
}
