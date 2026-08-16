import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SiteFooter, SiteHeader } from "../components/AppShell";
import ProductCard from "../components/listings/ProductCard";
import { UserAvatar } from "../components/ui/UserAvatar";
import { getAdConditionLabel } from "../lib/adCondition";
import { api } from "../services/api";
import { getToken } from "../services/auth";
import type { PublicUserProfile } from "../types";
import SeoHead from "../components/seo/SeoHead";

function formatNaira(value: number) {
  return `₦ ${value.toLocaleString()}`;
}

function statValue(value?: number) {
  return String(value ?? 0);
}

export default function PublicProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!id) {
        setError("User profile not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const [response, meResponse] = await Promise.all([
          api.getUser(id),
          getToken() ? api.me().catch(() => null) : Promise.resolve(null),
        ]);
        if (!cancelled) setProfile(response.data);
        if (!cancelled) setCurrentUserId(meResponse?.data.id ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleFollowToggle = async () => {
    if (!profile || followLoading) return;
    if (!getToken()) {
      navigate("/login");
      return;
    }

    try {
      setFollowLoading(true);
      const response = profile.isFollowing ? await api.unfollowUser(profile.id) : await api.followUser(profile.id);
      setProfile((current) => current
        ? {
            ...current,
            isFollowing: response.data.following,
            stats: {
              adverts: current.stats?.adverts ?? current.ads.length,
              followers: response.data.stats.followers,
              following: response.data.stats.following,
            },
          }
        : current,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page text-ink">
      {profile ? (
        <SeoHead
          title={`${profile.fullName} | Qwik`}
          description={`View ${profile.fullName}'s profile and active listings on Qwik, Nigeria's trusted online marketplace.`}
          canonicalUrl={`https://www.qwik.ng/users/${encodeURIComponent(profile.id)}`}
        />
      ) : null}
      <SiteHeader navigate={navigate} />
      <main className="mx-auto w-full max-w-[1512px] px-5 pb-20 pt-8 sm:px-10 lg:px-[60px]">
        {loading ? (
          <div className="h-[260px] animate-pulse rounded-[20px] bg-white" />
        ) : error || !profile ? (
          <section className="grid min-h-[50vh] place-items-center rounded-[20px] bg-white p-8 text-center">
            <div>
              <h1 className="text-[28px] font-semibold">Profile unavailable</h1>
              <p className="mt-2 text-muted">{error || "This user profile could not be loaded."}</p>
            </div>
          </section>
        ) : (
          <>
            <section className="rounded-[20px] bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <UserAvatar
                    name={profile.fullName}
                    imageUrl={profile.profile?.avatarUrl}
                    alt={`${profile.fullName} profile`}
                    className="h-[92px] w-[92px] rounded-full object-cover text-[24px]"
                  />
                  <div className="min-w-0">
                    <h1 className="truncate text-[30px] font-semibold leading-tight sm:text-[38px]">{profile.fullName}</h1>
                    <p className="mt-1 text-[16px] text-muted">{profile.location || "Location not specified"}</p>
                    {profile.profile?.bio ? <p className="mt-3 max-w-[620px] text-[15px] leading-[1.45] text-[#5f5d68]">{profile.profile.bio}</p> : null}
                  </div>
                </div>
                {currentUserId !== profile.id ? (
                  <button
                    type="button"
                    onClick={() => void handleFollowToggle()}
                    disabled={followLoading}
                    className="h-[44px] rounded-[10px] bg-gradient-to-r from-amber to-orange px-5 text-[15px] font-semibold text-white shadow-glow disabled:opacity-60"
                  >
                    {followLoading ? "Updating..." : profile.isFollowing ? "Following" : "Follow"}
                  </button>
                ) : null}
              </div>
              <div className="mt-7 grid max-w-[420px] grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[26px] font-semibold">{statValue(profile.stats?.following)}</p>
                  <p className="text-[14px] text-muted">Following</p>
                </div>
                <div>
                  <p className="text-[26px] font-semibold">{statValue(profile.stats?.followers)}</p>
                  <p className="text-[14px] text-muted">Followers</p>
                </div>
                <div>
                  <p className="text-[26px] font-semibold">{statValue(profile.stats?.adverts ?? profile.ads.length)}</p>
                  <p className="text-[14px] text-muted">adverts</p>
                </div>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="mb-4 text-[28px] font-semibold">Ads by {profile.fullName}</h2>
              {profile.ads.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {profile.ads.map((ad) => (
                    <ProductCard
                      key={ad.id}
                      item={{
                        title: ad.title,
                        price: formatNaira(ad.price),
                        location: ad.location,
                        description: ad.description,
                        image: ad.images?.[0]?.url,
                        condition: getAdConditionLabel(ad.condition),
                      }}
                      onClick={() => navigate(`/product-details/${ad.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[18px] bg-white p-8 text-center text-muted">No active ads yet.</div>
              )}
            </section>
          </>
        )}
      </main>
      <SiteFooter navigate={navigate} />
    </div>
  );
}