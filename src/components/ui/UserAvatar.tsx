import { getUserInitials } from "../../lib/currentUser";
import { normalizeImageUrl } from "../../lib/imageUrls";
import { useEffect, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

type UserAvatarProps = {
  name: string;
  imageUrl?: string;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  /** When true, clicking a real (non-placeholder) avatar image opens it full size in a lightbox. */
  enableViewer?: boolean;
};

export function UserAvatar({
  name,
  imageUrl,
  alt,
  className = "",
  fallbackClassName = "",
  enableViewer = false,
}: UserAvatarProps) {
  const normalizedImageUrl = normalizeImageUrl(imageUrl);
  const [imageFailed, setImageFailed] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [normalizedImageUrl]);

  if (normalizedImageUrl && !imageFailed) {
    const image = <img src={normalizedImageUrl} alt={alt ?? name} className={className} onError={() => setImageFailed(true)} />;

    if (!enableViewer) return image;

    return (
      <>
        <button
          type="button"
          onClick={() => setIsViewerOpen(true)}
          aria-label={`View ${alt ?? name} full size`}
          className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2"
        >
          {image}
        </button>
        <Lightbox
          open={isViewerOpen}
          close={() => setIsViewerOpen(false)}
          slides={[{ src: normalizedImageUrl }]}
          plugins={[Zoom]}
          zoom={{ maxZoomPixelRatio: 4, zoomInMultiplier: 2, doubleTapDelay: 300, scrollToZoom: true }}
          controller={{ closeOnBackdropClick: true }}
        />
      </>
    );
  }

  return (
    <div
      aria-label={alt ?? name}
      className={`grid place-items-center rounded-full bg-[#ececee] text-[15px] font-semibold uppercase tracking-[0.08em] text-[#6d6a74] ${className} ${fallbackClassName}`.trim()}
      role="img"
    >
      <span aria-hidden="true">{getUserInitials(name)}</span>
    </div>
  );
}
