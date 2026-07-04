import type { CSSProperties } from "react";
import { LocationPin } from "../icons/LocationPin";
import { ImagePlaceholder } from "../ui/ImagePlaceholder";
import { FallbackImage } from "../ui/FallbackImage";
import VerifiedSellerBadge from "./VerifiedSellerBadge";
import PromotedBadge from "./PromotedBadge";

export type ListingCardItem = {
  price: string;
  title: string;
  description: string;
  location: string;
  image?: string;
  imageFit?: "cover" | "contain";
  verifiedSeller?: boolean;
  isPromoted?: boolean;
  promotedUntil?: string;
};

type ListingCardProps = {
  item: ListingCardItem;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: "grid" | "list";
  interactive?: boolean;
  showBadge?: boolean;
  badgeLabel?: string;
  descriptionClassName?: string;
  clampTitleLines?: number;
  clampDescriptionLines?: number;
  clampLocationLines?: number;
  imageHeightClassName?: string;
};

const clampStyle = (lines?: number): CSSProperties | undefined =>
  lines
    ? { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden" }
    : undefined;

export default function ListingCard({
  item,
  href,
  onClick,
  className = "",
  variant = "grid",
  interactive = false,
  showBadge = true,
  badgeLabel = "New",
  descriptionClassName = "text-[#6d6a74]",
  clampTitleLines,
  clampDescriptionLines,
  clampLocationLines,
  imageHeightClassName = "h-[170px] sm:h-[260px]",
}: ListingCardProps) {
  const isList = variant === "list";
  const interactiveClasses = interactive ? "cursor-pointer transition hover:scale-[1.01]" : "";

  return (
    <article
      className={`relative rounded-[24px] border border-[#ddd9d2] bg-white p-3 shadow-[0_8px_24px_rgba(31,29,39,0.05)] sm:rounded-[28px] sm:p-4 ${interactiveClasses} ${className}`.trim()}
      onClick={onClick}
    >
      {href ? (
        <a
          href={href}
          aria-label={`View details for ${item.title}`}
          className="absolute inset-0 z-0 rounded-[24px] sm:rounded-[28px]"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onClick?.();
          }}
        />
      ) : null}
      <div className={isList ? "grid grid-cols-[120px_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center sm:gap-5" : ""}>
        <div className={`relative w-full overflow-hidden rounded-[18px] bg-white sm:rounded-[22px] ${isList ? "h-[120px] sm:h-[190px]" : imageHeightClassName}`.trim()}>
          {item.verifiedSeller ? <VerifiedSellerBadge /> : null}
          {item.image ? (
            <FallbackImage
              src={item.image}
              alt={item.title}
              fit={item.imageFit === "contain" ? "contain" : "cover"}
              className={`h-full w-full ${item.imageFit === "contain" ? "p-4" : ""}`}
              fallback={<ImagePlaceholder title="" labelClassName="hidden" className="rounded-[14px] sm:rounded-[18px]" />}
            />
          ) : (
            <ImagePlaceholder title="" labelClassName="hidden" className="rounded-[14px] sm:rounded-[18px]" />
          )}
        </div>
        <div className={`relative z-10 ${isList ? "px-0 pb-1 pt-0" : "px-0 pb-1 pt-4 sm:pt-5"}`}>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 min-w-0 text-[18px] font-semibold leading-none text-[#1f1d27] sm:text-[20px]">{item.price}</h3>
            {item.isPromoted && item.promotedUntil && new Date(item.promotedUntil) > new Date() ? (
              <PromotedBadge />
            ) : null}
          </div>
          <h4
            className="mb-2 mt-4 text-[15px] font-medium leading-[1.32] text-[#1f1d27] sm:text-[18px]"
            style={clampStyle(clampTitleLines)}
          >
            {item.title}
          </h4>
          <p
            className={`mb-3 text-[13px] leading-[1.45] sm:mb-4 sm:text-[15px] ${descriptionClassName}`}
            style={clampStyle(clampDescriptionLines)}
          >
            {item.description}
          </p>
          <div className="flex items-end justify-between gap-2">
            <small className="flex min-w-0 items-center gap-1 text-[13px] text-[#5f5d6c] sm:text-[15px]">
              <LocationPin className="h-4 w-4 shrink-0" />
              <span style={clampStyle(clampLocationLines)}>{item.location}</span>
            </small>
            {showBadge ? (
              <span className="shrink-0 rounded-[8px] bg-badge-bg px-2 py-0.5 text-[11px] font-medium text-[#c07a1f] sm:text-[12px]">
                {badgeLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
