import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CloudRain, X } from "lucide-react";
import { useCampaign } from "../context/CampaignContext";

const DISMISS_KEY = "neobonn_promo_dismissed_v1";

export default function PromoBanner() {
  const { campaign } = useCampaign();
  const [dismissed, setDismissed] = useState(false);

  // Re-show the banner whenever the *content* changes (a new campaign
  // went live) even if an older campaign's banner was dismissed this
  // session — otherwise a brand-new sale could stay invisible for
  // anyone who dismissed a previous, unrelated banner.
  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === campaign?.id);
  }, [campaign?.id]);

  const dismiss = () => {
    if (campaign?.id) sessionStorage.setItem(DISMISS_KEY, campaign.id);
    setDismissed(true);
  };

  // Nothing to announce right now — stay invisible rather than show a
  // sale that isn't actually live.
  if (!campaign || !campaign.stripText || dismissed) return null;

  return (
    <div className="relative overflow-hidden bg-[var(--color-forest-dark)] text-white">
      {/* subtle animated rain-stripe backdrop */}
      <div className="pointer-events-none absolute inset-0 opacity-10 [background:repeating-linear-gradient(115deg,white_0px,white_1px,transparent_1px,transparent_14px)]" />

      <div className="relative mx-auto flex max-w-[1600px] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-10 py-2.5 text-center sm:px-8">
        <CloudRain size={16} className="shrink-0 text-[var(--color-gold-light)]" />
        <p className="text-xs font-medium tracking-wide sm:text-sm">{campaign.stripText}</p>
        <Link
          to={campaign.ctaLink || "/products"}
          className="ml-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-forest-dark)] transition-transform hover:scale-105 sm:text-xs"
        >
          Shop Now
        </Link>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss offer banner"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X size={16} />
      </button>
    </div>
  );
}
