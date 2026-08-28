import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SiteFooter, SiteHeader } from "../components/AppShell";
import SettingsSidebar, { MobileSettingsMenu } from "../components/settings/SettingsSidebar";
import { getSettingsNavItems } from "../lib/settings-nav-config";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";
import type { ReferralListItem, ReferralSummary } from "../types";

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusLabel(status: ReferralListItem["status"]) {
  if (status === "ACTIVE") return "Active";
  if (status === "REVOKED") return "Revoked";
  return "Pending verification";
}

function statusBadgeClass(status: ReferralListItem["status"]) {
  if (status === "ACTIVE") return "bg-[#d9f4e3] text-[#1f7742]";
  if (status === "REVOKED") return "bg-[#fbe1e1] text-[#c0362c]";
  return "bg-[#f8f0da] text-[#8a6a1f]";
}

export default function ReferralsPage() {
  const navigate = useNavigate();
  const { error: showError, success } = useToast();
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [referrals, setReferrals] = useState<ReferralListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [summaryRes, listRes] = await Promise.all([api.getReferralSummary(), api.getReferralList()]);
        if (cancelled) return;
        setSummary(summaryRes.data);
        setReferrals(listRes.data);
      } catch (err) {
        if (!cancelled) showError(err instanceof Error ? err.message : "Failed to load referrals");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const referralLink = summary?.code ? `${window.location.origin}/signup?ref=${summary.code}` : "";

  const copyLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      success("Referral link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showError("Could not copy link");
    }
  };

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="hidden md:block">
        <SiteHeader navigate={navigate} />
      </div>

      <div className="px-4 pb-2 pt-5 sm:px-6 md:hidden">
        <button
          type="button"
          onClick={() => navigate("/")}
          aria-label="Go to homepage"
          className="inline-flex items-center rounded-[10px] bg-transparent p-1 text-[#ff8300] transition-opacity duration-200 hover:opacity-80"
        >
          <img src="/images/logo-header.png" alt="Qwik" className="h-[34px] w-[34px] object-contain" />
          <span className="ml-2 text-[28px] font-normal leading-none">qwik</span>
        </button>
      </div>

      <main className="mx-auto w-full max-w-[1728px] px-4 pb-20 pt-8 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[310px_1fr]">
          <SettingsSidebar className="hidden md:block" items={getSettingsNavItems(navigate, "referrals")} />

          <section className="min-w-0">
            <div className="mb-4">
              <MobileSettingsMenu items={getSettingsNavItems(navigate, "referrals")} label="Settings" />
            </div>

            <div className="rounded-card bg-white p-6">
              <h1 className="text-[20px] font-semibold text-ink">Referrals</h1>
              <p className="mt-1 text-[14px] text-[#7a7884]">Invite vendors to Qwik and earn when they get verified.</p>

              {loading ? (
                <p className="mt-6 text-[14px] text-[#7a7884]">Loading...</p>
              ) : (
                <>
                  <div className="mt-6 flex flex-wrap items-center gap-3 rounded-[14px] border border-[#eceaf0] bg-[#faf9fc] p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-[#94919d]">Your referral link</p>
                      <p className="truncate text-[15px] font-medium text-ink">{referralLink || "Unavailable"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={copyLink}
                      disabled={!referralLink}
                      className="shrink-0 rounded-[10px] bg-gradient-to-r from-amber to-orange px-4 py-2 text-[14px] font-semibold text-white disabled:opacity-50"
                    >
                      {copied ? "Copied" : "Copy link"}
                    </button>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-[14px] border border-[#eceaf0] p-4">
                      <p className="text-[13px] text-[#94919d]">Total referrals</p>
                      <p className="mt-1 text-[20px] font-semibold text-ink">{summary?.totalReferrals ?? 0}</p>
                    </div>
                    <div className="rounded-[14px] border border-[#eceaf0] p-4">
                      <p className="text-[13px] text-[#94919d]">Active</p>
                      <p className="mt-1 text-[20px] font-semibold text-ink">{summary?.referralsByStatus.ACTIVE ?? 0}</p>
                    </div>
                    <div className="rounded-[14px] border border-[#eceaf0] p-4">
                      <p className="text-[13px] text-[#94919d]">Pending earnings</p>
                      <p className="mt-1 text-[20px] font-semibold text-ink">{formatNaira(summary?.earnings.pending ?? 0)}</p>
                    </div>
                    <div className="rounded-[14px] border border-[#eceaf0] p-4">
                      <p className="text-[13px] text-[#94919d]">Paid earnings</p>
                      <p className="mt-1 text-[20px] font-semibold text-ink">{formatNaira(summary?.earnings.paid ?? 0)}</p>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h2 className="text-[16px] font-semibold text-ink">Your referred vendors</h2>
                    {referrals.length === 0 ? (
                      <p className="mt-3 text-[14px] text-[#7a7884]">No referrals yet. Share your link to get started.</p>
                    ) : (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full min-w-[560px] text-left text-[14px]">
                          <thead>
                            <tr className="text-[#94919d]">
                              <th className="pb-2 font-medium">Vendor</th>
                              <th className="pb-2 font-medium">Status</th>
                              <th className="pb-2 font-medium">Joined</th>
                              <th className="pb-2 font-medium">Earnings</th>
                            </tr>
                          </thead>
                          <tbody>
                            {referrals.map((referral) => (
                              <tr key={referral.id} className="border-t border-[#eceaf0]">
                                <td className="py-3">
                                  <p className="font-medium text-ink">{referral.referredUser.fullName}</p>
                                  <p className="text-[12px] text-[#94919d]">{referral.referredUser.email}</p>
                                </td>
                                <td className="py-3">
                                  <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${statusBadgeClass(referral.status)}`}>
                                    {statusLabel(referral.status)}
                                  </span>
                                </td>
                                <td className="py-3 text-ink">{new Date(referral.createdAt).toLocaleDateString()}</td>
                                <td className="py-3 text-ink">{formatNaira(referral.totalRewardAmount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter navigate={navigate} />
    </div>
  );
}
