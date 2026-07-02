import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { setRole, setToken } from "../services/auth";
import { clearUserCache } from "../hooks/useUserCache";
import FormInput from "../components/ui/FormInput";
import FormButton from "../components/ui/FormButton";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const canLogin = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  const handleLogin = async () => {
    try {
      setError("");
      setIsSubmitting(true);
      const res = await api.login({ email: email.trim().toLowerCase(), password }, { authContext: "admin" });
      
      // Check if user is admin
      if (res.data.user.role !== "ADMIN") {
        setError("Admin access required. Only administrators can log in here.");
        return;
      }
      
      setToken(res.data.token);
      setRole(res.data.user.role);
      clearUserCache(); // Clear cache on admin login
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f3f3f5] font-outfit text-[#1f1f29]">
      <header className="flex items-center justify-between px-[60px] pt-[48px]">
        <button onClick={() => navigate("/")} className="text-[36px] font-normal leading-none text-[#ff8300] sm:text-[40px]">
          qwik
        </button>
        <div className="text-[16px] text-[#9a99a6]">
          <span className="text-[#ff8f00] font-semibold">Admin Panel</span>
        </div>
      </header>

      <main className="mx-auto flex h-[calc(100vh-120px)] w-full max-w-[1728px] items-center justify-center px-4 pb-8">
        <section className="mx-auto w-[430px] rounded-[24px] bg-white px-[22px] pb-[24px] pt-[18px]">
          <h2 className="mb-[14px] text-center text-[28px] font-normal leading-[1.05] text-[#22222b]">Admin Login</h2>
          <p className="mb-[16px] text-center text-[12px] text-[#7f7e88]">Administrators only</p>

          {error && (
            <div className="mb-[16px] rounded-[8px] bg-[#fde8e8] p-[12px] text-[14px] text-[#d32f2f]">
              {error}
            </div>
          )}

          <FormInput
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            containerClassName="mb-[14px]"
          />

          <FormInput
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            containerClassName="mb-[16px]"
          />

          <FormButton
            disabled={!canLogin || isSubmitting}
            buttonClassName={`h-[48px] rounded-btn text-[14px] font-medium ${canLogin && !isSubmitting ? "bg-gradient-to-r from-amber to-orange text-white shadow-glow hover:opacity-95" : ""}`}
            onClick={handleLogin}
            isLoading={isSubmitting}
            loadingText="Logging in..."
          >
            Login as Admin
          </FormButton>

          <div className="mt-[16px] text-center">
            <button
              onClick={() => navigate("/login")}
              className="text-[12px] text-[#9a99a6] hover:text-[#ff8300]"
            >
              Regular user? Sign in here →
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
