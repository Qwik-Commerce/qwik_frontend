import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SiteFooter, SiteHeader } from "../components/AppShell";
import SettingsSidebar, { MobileSettingsMenu } from "../components/settings/SettingsSidebar";
import DropdownSelect from "../components/ui/DropdownSelect";
import Toggle from "../components/ui/Toggle";
import { UserAvatar } from "../components/ui/UserAvatar";
import { useToast } from "../context/ToastContext";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useMessageNotificationsSetting } from "../hooks/useMessageNotificationsSetting";
import { clearUserCache } from "../hooks/useUserCache";
import { api } from "../services/api";
import { getSettingsNavItems } from "../lib/settings-nav-config";
import { ALL_NIGERIA_LOCATION, NIGERIAN_AREAS, NIGERIAN_LOCATIONS } from "../lib/searchContext";
import ProfileStatsModal from "../components/settings/ProfileStatsModal";
import { ROUTES } from "../constants/routes";
import type { FollowerSeller, FollowingSeller } from "../types";
import { isProfileComplete } from "../lib/profileCompletion";

type TabKey = "edit-profile" | "company-details" | "chat-settings";

type ProfileSnapshot = {
  fullName: string;
  email: string;
  bio: string;
  phone: string;
  locationState: string;
  locationArea: string;
  avatarUrl: string;
};

type StatsModalMode = "following" | "followers" | null;

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-[#eceaf0] bg-[#faf9fc] px-4 py-3">
      <p className="text-[13px] text-[#94919d]">{label}</p>
      <p className="mt-1 text-[15px] font-medium text-ink">{value}</p>
    </div>
  );
}

function toProvidedValue(value?: string | null, options?: { treatQwikUserAsMissing?: boolean }) {
  if (typeof value !== "string") return "Not provided";
  const normalized = value.trim();
  if (!normalized) return "Not provided";
  if (options?.treatQwikUserAsMissing && normalized === "Qwik User") return "Not provided";
  return normalized;
}

function getVerificationStatusLabel(status?: string | null) {
  if (!status) return "Not provided";
  if (status === "APPROVED") return "Verified";
  if (status === "SUBMITTED" || status === "IN_REVIEW") return "Pending verification";
  if (status === "REJECTED" || status === "DRAFT") return "Not verified";
  return "Not provided";
}

export default function ProfileSettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { user, display, setUser } = useCurrentUser();
  const profileFallback = (user?.profile ?? {}) as Record<string, unknown>;
  
  // Extract query params for required profile mode
  const searchParams = new URLSearchParams(location.search);
  const requiredMode = searchParams.get("required") === "true";
  const redirectParam = searchParams.get("redirect");
  
  const [activeTab, setActiveTab] = useState<TabKey>("edit-profile");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [locationState, setLocationState] = useState("");
  const [locationArea, setLocationArea] = useState("");
  const [selectedLogoName, setSelectedLogoName] = useState("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [initialProfile, setInitialProfile] = useState<ProfileSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const chatSettings = useMessageNotificationsSetting();
  const [statsModal, setStatsModal] = useState<StatsModalMode>(null);
  const [followers, setFollowers] = useState<FollowerSeller[]>([]);
  const [following, setFollowing] = useState<FollowingSeller[]>([]);
  const [followersLoaded, setFollowersLoaded] = useState(false);
  const [followingLoaded, setFollowingLoaded] = useState(false);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedAvatarFile) {
      setAvatarPreviewUrl("");
      return;
    }

    const previewUrl = URL.createObjectURL(selectedAvatarFile);
    setAvatarPreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedAvatarFile]);

  const companyDetails = {
    businessName: toProvidedValue(user?.fullName ?? display.fullName, { treatQwikUserAsMissing: true }),
    description: toProvidedValue(user?.profile?.bio ?? display.bio),
    businessAddress: toProvidedValue(user?.location ?? display.location),
    verificationStatus: getVerificationStatusLabel(user?.verification?.status),
    memberSince: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Not provided",
    activeAds: String(user?.stats?.adverts ?? display.stats.find((stat) => stat.label.toLowerCase().includes("ads"))?.value ?? 0),
  };

  useEffect(() => {
      const nextFullName = user?.fullName ?? display.fullName;
      const nextEmail = user?.email ?? display.email;
      const nextBio = user?.profile?.bio ?? display.bio;
      const nextPhone = user?.phone ?? display.phone;
      const nextAvatarUrl = user?.profile?.avatarUrl ?? display.avatarUrl;

    // Prefer structured fields when present; otherwise parse legacy `location`.
    const existingLocation = (user?.location ?? (typeof profileFallback.location === "string" ? profileFallback.location : display.location) ?? "").trim();
    const explicitState = (user?.locationState ?? "").trim();
    const explicitArea = (user?.locationArea ?? "").trim();
      let nextLocationState = "";
      let nextLocationArea = "";
      if (explicitState || explicitArea) {
        nextLocationState = explicitState;
        nextLocationArea = explicitArea;
    } else if (existingLocation) {
      // Try "Area, State" pattern first
      const parts = existingLocation.split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 2 && NIGERIAN_LOCATIONS.includes(parts[parts.length - 1])) {
          nextLocationState = parts[parts.length - 1];
          nextLocationArea = parts.slice(0, -1).join(", ");
      } else if (NIGERIAN_LOCATIONS.includes(existingLocation)) {
          nextLocationState = existingLocation;
          nextLocationArea = "";
      } else {
          nextLocationState = "";
          nextLocationArea = existingLocation;
      }
    }

      setFullName(nextFullName);
      setEmail(nextEmail);
      setBio(nextBio);
      setPhone(nextPhone);
      setAvatarUrl(nextAvatarUrl);
      setLocationState(nextLocationState);
      setLocationArea(nextLocationArea);
      setInitialProfile({
        fullName: nextFullName,
        email: nextEmail,
        bio: nextBio,
        phone: nextPhone,
        locationState: nextLocationState,
        locationArea: nextLocationArea,
        avatarUrl: nextAvatarUrl,
      });
      setIsEditMode(false);
      setSelectedAvatarFile(null);
      setSelectedLogoName("");
  }, [display.avatarUrl, display.bio, display.email, display.fullName, display.location, display.phone, profileFallback.location, user]);

  const stateOptions = useMemo(() => NIGERIAN_LOCATIONS.filter((s) => s !== ALL_NIGERIA_LOCATION), []);
  const areasForState = locationState ? NIGERIAN_AREAS[locationState] : undefined;
    const hasChanges = useMemo(() => {
      if (!initialProfile) return false;
      return (
        fullName !== initialProfile.fullName
        || bio !== initialProfile.bio
        || phone !== initialProfile.phone
        || locationState !== initialProfile.locationState
        || locationArea !== initialProfile.locationArea
        || selectedAvatarFile !== null
      );
    }, [bio, fullName, initialProfile, locationArea, locationState, phone, selectedAvatarFile]);

    const handleAvatarFileChange = (file: File | null) => {
      if (!isEditMode || loading) return;
      setSelectedAvatarFile(file);
      setSelectedLogoName(file?.name || "");
    };

    const handleCancelEdit = () => {
      if (!initialProfile || loading) return;
      setFullName(initialProfile.fullName);
      setEmail(initialProfile.email);
      setBio(initialProfile.bio);
      setPhone(initialProfile.phone);
      setLocationState(initialProfile.locationState);
      setLocationArea(initialProfile.locationArea);
      setAvatarUrl(initialProfile.avatarUrl);
      setSelectedAvatarFile(null);
      setSelectedLogoName("");
      setIsEditMode(false);
    };

    const handleSaveProfile = async () => {
      if (loading || !isEditMode || !hasChanges) return;
      
      // In required mode, validate that phone, state, and area are filled
      if (requiredMode) {
        if (!phone.trim()) {
          showError("Phone number is required");
          return;
        }
        if (!locationState.trim()) {
          showError("State is required");
          return;
        }
        if (!locationArea.trim()) {
          showError("Area is required");
          return;
        }
      }
      
      try {
        setLoading(true);
        let nextAvatarUrl = avatarUrl;
        if (selectedAvatarFile) {
          const uploadResponse = await api.uploadImages([selectedAvatarFile]);
          nextAvatarUrl = uploadResponse.data.urls[0] || "";
        }
        const trimmedState = locationState.trim();
        const trimmedArea = locationArea.trim();
        const composedLocation = trimmedState
          ? (trimmedArea ? `${trimmedArea}, ${trimmedState}` : trimmedState)
          : trimmedArea;
        const response = await api.updateMe({
          fullName,
          bio,
          phone,
          location: composedLocation,
          locationState: trimmedState || undefined,
          locationArea: trimmedArea || undefined,
          ...(nextAvatarUrl ? { avatarUrl: nextAvatarUrl } : {}),
        });
        setUser(response.data);
        clearUserCache(); // Clear cache to sync across pages
        setAvatarUrl(response.data.profile?.avatarUrl || "");
        setSelectedAvatarFile(null);
        setSelectedLogoName("");
        setIsEditMode(false);
        success("Profile updated");
        
        // If in required mode and redirect param exists, navigate to redirect target
        if (requiredMode && redirectParam) {
          navigate(redirectParam);
        }
      } catch (error) {
        showError(error instanceof Error ? error.message : "Failed to update profile");
      } finally {
        setLoading(false);
      }
    };

    const baseFollowing = user?.stats?.following ?? Number(display.stats.find((stat) => stat.label.toLowerCase() === "following")?.value ?? 0);
    const baseFollowers = user?.stats?.followers ?? Number(display.stats.find((stat) => stat.label.toLowerCase() === "followers")?.value ?? 0);
    const baseAdverts = user?.stats?.adverts ?? Number(display.stats.find((stat) => stat.label.toLowerCase().includes("ad"))?.value ?? 0);
    const followingCount = followingLoaded ? following.length : baseFollowing;
    const followersCount = followersLoaded ? followers.length : baseFollowers;

    const loadFollowing = async () => {
      try {
        setLoadingFollowing(true);
        setStatsError(null);
        const response = await api.getMyFollowing();
        setFollowing(response.data);
        setFollowingLoaded(true);
      } catch (error) {
        setStatsError(error instanceof Error ? error.message : "Failed to load following users");
      } finally {
        setLoadingFollowing(false);
      }
    };

    const loadFollowers = async () => {
      try {
        setLoadingFollowers(true);
        setStatsError(null);
        const response = await api.getMyFollowers();
        setFollowers(response.data);
        setFollowersLoaded(true);
      } catch (error) {
        setStatsError(error instanceof Error ? error.message : "Failed to load followers");
      } finally {
        setLoadingFollowers(false);
      }
    };

    const handleOpenFollowing = () => {
      setStatsModal("following");
      void loadFollowing();
    };

    const handleOpenFollowers = () => {
      setStatsModal("followers");
      void loadFollowers();
    };

    const handleStatClick = (label: string) => {
      const normalized = label.toLowerCase();
      if (normalized === "following") {
        handleOpenFollowing();
        return;
      }
      if (normalized === "followers") {
        handleOpenFollowers();
        return;
      }
      if (normalized.includes("ad")) {
        navigate(ROUTES.ADS_DASHBOARD);
      }
    };

    const handleUnfollow = async (sellerId: string) => {
      if (unfollowingId) return;
      const previous = following;
      try {
        setUnfollowingId(sellerId);
        setStatsError(null);
        setFollowing((current) => current.filter((seller) => seller.id !== sellerId));
        await api.unfollowUser(sellerId);
      } catch (error) {
        setFollowing(previous);
        setStatsError(error instanceof Error ? error.message : "Failed to unfollow user");
      } finally {
        setUnfollowingId(null);
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
          className="inline-flex items-center rounded-[10px] bg-transparent p-1 text-[#ff8300] transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2 focus-visible:ring-offset-page"
        >
          <img src="/images/logo-header.png" alt="Qwik" className="h-[34px] w-[34px] object-contain" />
          <span className="ml-2 text-[28px] font-normal leading-none">qwik</span>
        </button>
      </div>

      <main className="mx-auto w-full max-w-[1728px] px-4 pb-20 pt-8 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[310px_1fr]">
          <SettingsSidebar
            className="hidden md:block"
            items={getSettingsNavItems(navigate, "profile")}
          />

          <section className="min-w-0">
            <div className="mb-4">
              <MobileSettingsMenu items={getSettingsNavItems(navigate, "profile")} label="Settings" />
            </div>
            <div className="rounded-card bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative">
                      <label className={`block ${isEditMode && !loading ? "cursor-pointer" : "cursor-not-allowed"}`} aria-label="Choose profile photo">
                      <UserAvatar
                        name={fullName || display.fullName}
                        imageUrl={avatarPreviewUrl || avatarUrl}
                        alt={`${fullName || display.fullName} profile`}
                        className="h-[84px] w-[84px] rounded-full object-cover"
                      />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                          disabled={!isEditMode || loading}
                        onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            handleAvatarFileChange(file);
                        }}
                      />
                    </label>
                  </div>
                  <div className="min-w-0 max-w-full">
                    <h1 className="truncate whitespace-nowrap text-[28px] font-medium leading-tight sm:text-[32px]">{fullName || display.fullName}</h1>
                    <p className="truncate text-[16px] text-[#8c8996]">{email || ""}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 text-center sm:gap-10">
                  {display.stats.map((stat) => {
                    const normalized = stat.label.toLowerCase();
                    const value = normalized === "following"
                      ? followingCount
                      : normalized === "followers"
                        ? followersCount
                        : normalized.includes("ad")
                          ? baseAdverts
                          : Number(stat.value) || 0;
                    return (
                      <button
                        key={stat.label}
                        type="button"
                        onClick={() => handleStatClick(stat.label)}
                        className="rounded-[10px] p-1 text-center transition hover:bg-[#f7f5fb]"
                      >
                        <p className="text-[24px] sm:text-[28px]">{value}</p>
                        <p className="text-[14px] text-[#8c8996] sm:text-[15px]">{stat.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 max-w-[760px] max-w-full">
              <div className="mb-6 flex flex-wrap gap-3 text-[16px] sm:text-[18px]">
                <button
                  className={`whitespace-nowrap ${activeTab === "edit-profile" ? "font-medium text-ink" : "text-[#9794a1]"}`}
                  onClick={() => setActiveTab("edit-profile")}
                  type="button"
                >
                  Edit Profile
                </button>
                <button
                  className={`whitespace-nowrap ${activeTab === "company-details" ? "font-medium text-ink" : "text-[#9794a1]"}`}
                  onClick={() => setActiveTab("company-details")}
                  type="button"
                >
                  Company details
                </button>
                <button
                  className={`whitespace-nowrap ${activeTab === "chat-settings" ? "font-medium text-ink" : "text-[#9794a1]"}`}
                  onClick={() => setActiveTab("chat-settings")}
                  type="button"
                >
                  Chat settings
                </button>
              </div>

              {activeTab === "edit-profile" ? (
                <>
                    {requiredMode && (
                      <div className="mb-6 rounded-[10px] border border-red-300 bg-red-50 px-4 py-3">
                        <p className="text-[14px] font-medium text-red-700">
                          Complete your profile to post ads. Phone number, state and area are required.
                        </p>
                      </div>
                    )}
                    <div className="mb-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsEditMode(true)}
                        disabled={isEditMode || loading}
                        className="h-10 rounded-[10px] border border-[#dedde4] px-4 text-[14px] text-ink transition-colors hover:border-[#ffb357] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Edit Profile
                      </button>
                      {isEditMode ? (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={loading}
                          className="h-10 rounded-[10px] border border-[#dedde4] px-4 text-[14px] text-[#6c6a74] transition-colors hover:border-[#cfcbd8] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>

                  <label className="mb-2 block text-[15px] text-[#94919d]">Business Name</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={!isEditMode || loading} className="mb-5 h-12 w-full rounded-[10px] border border-[#dedde4] bg-transparent px-3 text-[15px] outline-none disabled:cursor-not-allowed disabled:bg-[#f5f4f7] disabled:text-[#8f8a98]" placeholder="Enter your business name" />

                  <label className="mb-2 block text-[15px] text-[#94919d]">Description</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} disabled={!isEditMode || loading} className="mb-5 h-[120px] w-full rounded-[10px] border border-[#dedde4] bg-transparent px-3 py-3 text-[15px] outline-none disabled:cursor-not-allowed disabled:bg-[#f5f4f7] disabled:text-[#8f8a98]" placeholder="What does your company do?" />

                  <label className="mb-2 block text-[15px] text-[#94919d]">Profile / Logo Upload</label>
                    <label className={`mb-5 flex min-h-[52px] w-full items-center justify-between rounded-[10px] border border-dashed border-[#dedde4] px-3 text-[15px] text-[#6c6a74] ${isEditMode && !loading ? "cursor-pointer" : "cursor-not-allowed bg-[#f5f4f7]"}`}>
                    <span className="truncate">{selectedLogoName || "Choose a logo or profile image"}</span>
                    <span className="ml-4 shrink-0 text-[#ff7f11]">Browse</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                        disabled={!isEditMode || loading}
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                          handleAvatarFileChange(file);
                      }}
                    />
                  </label>

                  <label className="mb-2 block text-[15px] text-[#94919d]">Email</label>
                    <input type="email" value={email} readOnly disabled className="mb-5 h-12 w-full rounded-[10px] border border-[#dedde4] bg-transparent px-3 text-[15px] outline-none disabled:cursor-not-allowed disabled:bg-[#f5f4f7] disabled:text-[#8f8a98]" placeholder="@mail" />

                  <label className="mb-2 block text-[15px] text-[#94919d]">
                    Phone
                    {requiredMode && <span className="text-red-600"> *</span>}
                  </label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!isEditMode || loading} className="mb-5 h-12 w-full rounded-[10px] border border-[#dedde4] bg-transparent px-3 text-[15px] outline-none disabled:cursor-not-allowed disabled:bg-[#f5f4f7] disabled:text-[#8f8a98]" placeholder="0800 000 0000" />

                  <div className="mb-5 space-y-4">
                    <DropdownSelect
                      label={`State${requiredMode ? " *" : ""}`}
                      placeholder="Select your state"
                      value={locationState}
                      options={stateOptions.map((s) => ({ value: s, label: s }))}
                        disabled={!isEditMode || loading}
                      onChange={(val) => { setLocationState(val); setLocationArea(""); }}
                    />
                    {locationState && areasForState ? (
                      <DropdownSelect
                        label={`Area${requiredMode ? " *" : ""}`}
                        placeholder="Select your area"
                        value={locationArea}
                        options={areasForState.map((a) => ({ value: a, label: a }))}
                          disabled={!isEditMode || loading}
                        onChange={setLocationArea}
                      />
                    ) : locationState ? (
                      <div>
                        <label className="mb-2 block text-[15px] text-[#94919d]">
                          Area
                          {requiredMode && <span className="text-red-600"> *</span>}
                        </label>
                          <input type="text" value={locationArea} onChange={(e) => setLocationArea(e.target.value)} disabled={!isEditMode || loading} className="h-12 w-full rounded-[10px] border border-[#dedde4] bg-transparent px-3 text-[15px] outline-none disabled:cursor-not-allowed disabled:bg-[#f5f4f7] disabled:text-[#8f8a98]" placeholder="City or area (optional)" />
                      </div>
                    ) : null}
                  </div>

                    <button className="h-[50px] w-full rounded-[10px] bg-gradient-to-r from-amber to-orange text-[16px] text-white shadow-glow transition-all duration-200 hover:opacity-95 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={() => void handleSaveProfile()} disabled={!isEditMode || !hasChanges || loading}>
                    {loading ? "Saving..." : "Save"}
                  </button>
                </>
              ) : null}

              {activeTab === "company-details" ? (
                <>
                  <div className="mb-5 grid gap-4 sm:grid-cols-2">
                    <DetailCard label="Verification Status" value={companyDetails.verificationStatus} />
                    <DetailCard label="Active Ads" value={companyDetails.activeAds} />
                  </div>

                  <div className="space-y-4">
                    <DetailCard label="Business/Profile Name" value={companyDetails.businessName} />
                    <DetailCard label="Description" value={companyDetails.description} />
                    <DetailCard label="Business Address" value={companyDetails.businessAddress} />
                    <DetailCard label="Member Since" value={companyDetails.memberSince} />
                  </div>
                </>
              ) : null}

              {activeTab === "chat-settings" ? (
                <div className="max-w-[584px] space-y-[24px]">
                  {chatSettings.loading ? (
                    <div className="h-[56px] animate-pulse rounded-[14px] bg-white" />
                  ) : (
                    <div className="flex items-center justify-between gap-6 rounded-[14px] border border-[#eceaf0] bg-white px-4 py-4">
                      <span className="text-[16px] text-[#9c98a5]">Receive messages</span>
                      <Toggle
                        size="sm"
                        checked={chatSettings.messageNotifications}
                        onCheckedChange={chatSettings.setMessageNotifications}
                        ariaLabelChecked="Disable receive messages"
                        ariaLabelUnchecked="Enable receive messages"
                        className={chatSettings.saving ? "opacity-60" : ""}
                      />
                    </div>
                  )}

                  {chatSettings.error ? <p className="text-[14px] text-[#d14343]">{chatSettings.error}</p> : null}
                  {chatSettings.message ? <p className="text-[14px] text-[#248a4b]">{chatSettings.message}</p> : null}

                  <button
                    className="h-[48px] w-full max-w-[420px] rounded-[14px] bg-gradient-to-r from-amber to-orange text-[16px] text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-50 sm:h-[52px] sm:text-[18px]"
                    type="button"
                    onClick={() => void chatSettings.save()}
                    disabled={chatSettings.loading || chatSettings.saving || !chatSettings.hasChanges}
                  >
                    {chatSettings.saving ? "Saving..." : "Save"}
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>

      <div className="hidden md:block">
        <SiteFooter navigate={navigate} />
      </div>

      <ProfileStatsModal
        title="Following"
        users={following}
        loading={loadingFollowing}
        error={statsError}
        open={statsModal === "following"}
        onClose={() => setStatsModal(null)}
        onViewProfile={(id) => navigate(`/users/${id}`)}
        showUnfollow
        unfollowingId={unfollowingId}
        onUnfollow={handleUnfollow}
        showAdverts
        emptyText="You are not following any users yet."
      />

      <ProfileStatsModal
        title="Followers"
        users={followers}
        loading={loadingFollowers}
        error={statsError}
        open={statsModal === "followers"}
        onClose={() => setStatsModal(null)}
        onViewProfile={(id) => navigate(`/users/${id}`)}
        emptyText="You have no followers yet."
      />
    </div>
  );
}
