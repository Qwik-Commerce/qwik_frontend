import { useEffect, useState } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import AdminModerationModal from "../components/admin/AdminModerationModal";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";
import type { AdminReferral, AdminReferralCycle, AdminReferralPayout } from "../types";

type Tab = "referrals" | "cycles";

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function referralStatusBadgeClass(status: AdminReferral["status"]) {
  if (status === "ACTIVE") return "bg-green-100 text-green-800";
  if (status === "REVOKED") return "bg-red-100 text-red-800";
  return "bg-yellow-100 text-yellow-800";
}

function payoutStatusBadgeClass(status: AdminReferralPayout["status"]) {
  if (status === "PAID") return "bg-green-100 text-green-800";
  if (status === "FAILED") return "bg-red-100 text-red-800";
  return "bg-yellow-100 text-yellow-800";
}

function PayoutRecordModal({
  payout,
  onClose,
  onConfirm,
  loading,
}: {
  payout: AdminReferralPayout | null;
  onClose: () => void;
  onConfirm: (payload: { payoutReference: string; notes?: string }) => void;
  loading: boolean;
}) {
  const [payoutReference, setPayoutReference] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setPayoutReference("");
    setNotes("");
  }, [payout]);

  if (!payout) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label="Record payout">
      <div className="w-full max-w-[520px] rounded-[14px] border border-[#e6e4eb] bg-white p-5 shadow-[0_20px_45px_rgba(0,0,0,0.18)] sm:p-6">
        <h3 className="text-[20px] font-semibold text-[#1f1f29]">Record payout as paid</h3>
        <p className="mt-2 text-[14px] leading-[1.5] text-[#6b6875]">
          {payout.referrer.fullName} — {formatNaira(payout.totalAmount)}
        </p>

        <div className="mt-4">
          <label className="mb-1 block text-[13px] font-medium text-[#3a3743]" htmlFor="payout-reference">
            Payment reference
          </label>
          <input
            id="payout-reference"
            value={payoutReference}
            onChange={(e) => setPayoutReference(e.target.value)}
            placeholder="e.g. bank transfer reference"
            className="w-full rounded-[10px] border border-[#dedde4] px-3 py-2 text-[14px] text-[#1f1d27] focus:border-[#ff9715] focus:outline-none"
          />
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-[13px] font-medium text-[#3a3743]" htmlFor="payout-notes">
            Notes (optional)
          </label>
          <textarea
            id="payout-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-[10px] border border-[#dedde4] px-3 py-2 text-[14px] text-[#1f1d27] focus:border-[#ff9715] focus:outline-none"
          />
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="rounded-[10px] px-4 py-2 text-[14px] font-medium text-[#4b5563] hover:bg-[#f3f3f5]">
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || payoutReference.trim().length === 0}
            onClick={() => onConfirm({ payoutReference: payoutReference.trim(), notes: notes.trim() || undefined })}
            className="rounded-[10px] bg-[#1f8f5f] px-4 py-2 text-[14px] font-medium text-white hover:bg-[#18744e] disabled:opacity-50"
          >
            {loading ? "Recording..." : "Mark as paid"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminReferrals() {
  const { error: showError, success } = useToast();
  const [tab, setTab] = useState<Tab>("referrals");

  const [referrals, setReferrals] = useState<AdminReferral[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | AdminReferral["status"]>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<AdminReferral | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState(false);

  const [cycles, setCycles] = useState<AdminReferralCycle[]>([]);
  const [cyclesLoading, setCyclesLoading] = useState(true);
  const [payoutTarget, setPayoutTarget] = useState<AdminReferralPayout | null>(null);
  const [recordingPayout, setRecordingPayout] = useState(false);

  const fetchReferrals = async () => {
    try {
      setReferralsLoading(true);
      const response = await api.adminReferrals({
        search: searchTerm.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      setReferrals(response.data);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Unable to load referrals");
    } finally {
      setReferralsLoading(false);
    }
  };

  const fetchCycles = async () => {
    try {
      setCyclesLoading(true);
      const response = await api.adminReferralCycles();
      setCycles(response.data);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Unable to load settlement cycles");
    } finally {
      setCyclesLoading(false);
    }
  };

  useEffect(() => {
    void fetchReferrals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    if (tab === "cycles") void fetchCycles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      setRevoking(true);
      await api.revokeAdminReferral(revokeTarget.id, revokeReason.trim());
      success("Referral revoked");
      setRevokeTarget(null);
      setRevokeReason("");
      await fetchReferrals();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Unable to revoke referral");
    } finally {
      setRevoking(false);
    }
  };

  const handleRecordPayout = async (payload: { payoutReference: string; notes?: string }) => {
    if (!payoutTarget) return;
    try {
      setRecordingPayout(true);
      await api.markAdminReferralPayoutPaid(payoutTarget.id, payload);
      success("Payout recorded as paid");
      setPayoutTarget(null);
      await fetchCycles();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Unable to record payout");
    } finally {
      setRecordingPayout(false);
    }
  };

  return (
    <AdminLayout title="Referrals" description="Referral relationships, settlement cycles, and payout records">
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("referrals")}
          className={`rounded-full px-4 py-2 text-[13px] font-medium ${tab === "referrals" ? "bg-[#fff0e6] text-[#ff9715]" : "bg-white text-[#7f7e88]"}`}
        >
          Referrals
        </button>
        <button
          type="button"
          onClick={() => setTab("cycles")}
          className={`rounded-full px-4 py-2 text-[13px] font-medium ${tab === "cycles" ? "bg-[#fff0e6] text-[#ff9715]" : "bg-white text-[#7f7e88]"}`}
        >
          Settlement cycles
        </button>
      </div>

      {tab === "referrals" ? (
        <div className="rounded-[14px] bg-white p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search referrer or referred vendor"
              className="min-w-[240px] flex-1 rounded-[10px] border border-[#dedde4] px-3 py-2 text-[14px]"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-[10px] border border-[#dedde4] px-3 py-2 text-[14px]"
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING_VERIFICATION">Pending verification</option>
              <option value="ACTIVE">Active</option>
              <option value="REVOKED">Revoked</option>
            </select>
          </div>

          {referralsLoading ? (
            <p className="text-[14px] text-[#7f7e88]">Loading...</p>
          ) : referrals.length === 0 ? (
            <p className="text-[14px] text-[#7f7e88]">No referrals found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead>
                  <tr className="text-[#94919d]">
                    <th className="pb-2 font-medium">Referrer</th>
                    <th className="pb-2 font-medium">Referred vendor</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Signup IP</th>
                    <th className="pb-2 font-medium">Rewards</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="border-t border-[#eceaf0]">
                      <td className="py-3">
                        <p className="font-medium text-[#1f1f29]">{referral.referrer.fullName}</p>
                        <p className="text-[12px] text-[#94919d]">{referral.referrer.email}</p>
                        {referral.referrer.status === "BANNED" ? (
                          <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[11px] text-red-800">Banned</span>
                        ) : null}
                      </td>
                      <td className="py-3">
                        <p className="font-medium text-[#1f1f29]">{referral.referredUser.fullName}</p>
                        <p className="text-[12px] text-[#94919d]">{referral.referredUser.email}</p>
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${referralStatusBadgeClass(referral.status)}`}>
                          {referral.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 text-[#1f1f29]">{referral.signupIp ?? "—"}</td>
                      <td className="py-3 text-[#1f1f29]">
                        {formatNaira(referral.rewards.reduce((sum, r) => sum + r.rewardAmount, 0))}
                      </td>
                      <td className="py-3">
                        {referral.status !== "REVOKED" ? (
                          <button
                            type="button"
                            onClick={() => { setRevokeTarget(referral); setRevokeReason(""); }}
                            className="rounded-[8px] border border-red-200 px-3 py-1.5 text-[12px] font-medium text-red-700 hover:bg-red-50"
                          >
                            Revoke
                          </button>
                        ) : (
                          <span className="text-[12px] text-[#94919d]">{referral.revokedReason}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {cyclesLoading ? (
            <p className="text-[14px] text-[#7f7e88]">Loading...</p>
          ) : cycles.length === 0 ? (
            <p className="text-[14px] text-[#7f7e88]">No settlement cycles yet.</p>
          ) : (
            cycles.map((cycle) => (
              <div key={cycle.id} className="rounded-[14px] bg-white p-4 sm:p-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-[#1f1f29]">
                    {new Date(cycle.periodStart).toLocaleDateString()} – {new Date(cycle.periodEnd).toLocaleDateString()}
                  </h3>
                  <span className="rounded-full bg-[#f3f3f5] px-2.5 py-1 text-[12px] font-medium text-[#4b5563]">{cycle.status}</span>
                </div>

                {cycle.payouts.length === 0 ? (
                  <p className="text-[13px] text-[#94919d]">No payouts in this cycle.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-[13px]">
                      <thead>
                        <tr className="text-[#94919d]">
                          <th className="pb-2 font-medium">Referrer</th>
                          <th className="pb-2 font-medium">Amount</th>
                          <th className="pb-2 font-medium">Status</th>
                          <th className="pb-2 font-medium">Reference</th>
                          <th className="pb-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cycle.payouts.map((payout) => (
                          <tr key={payout.id} className="border-t border-[#eceaf0]">
                            <td className="py-3">
                              <p className="font-medium text-[#1f1f29]">{payout.referrer.fullName}</p>
                              <p className="text-[12px] text-[#94919d]">{payout.referrer.email}</p>
                            </td>
                            <td className="py-3 text-[#1f1f29]">{formatNaira(payout.totalAmount)}</td>
                            <td className="py-3">
                              <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${payoutStatusBadgeClass(payout.status)}`}>
                                {payout.status}
                              </span>
                            </td>
                            <td className="py-3 text-[#1f1f29]">{payout.payoutReference ?? "—"}</td>
                            <td className="py-3">
                              {payout.status === "PENDING" ? (
                                <button
                                  type="button"
                                  onClick={() => setPayoutTarget(payout)}
                                  className="rounded-[8px] bg-[#1f8f5f] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#18744e]"
                                >
                                  Mark as paid
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <AdminModerationModal
        open={Boolean(revokeTarget)}
        title="Revoke referral"
        description={revokeTarget ? `This will block future reward accrual between ${revokeTarget.referrer.fullName} and ${revokeTarget.referredUser.fullName}. Already-paid rewards are not affected.` : ""}
        confirmLabel="Revoke referral"
        tone="danger"
        loading={revoking}
        onClose={() => { setRevokeTarget(null); setRevokeReason(""); }}
        onConfirm={handleRevoke}
        reason={revokeReason}
        reasonRequired
        reasonLabel="Reason"
        reasonPlaceholder="e.g. suspicious signup pattern"
        onReasonChange={setRevokeReason}
      />

      <PayoutRecordModal
        payout={payoutTarget}
        onClose={() => setPayoutTarget(null)}
        onConfirm={handleRecordPayout}
        loading={recordingPayout}
      />
    </AdminLayout>
  );
}
