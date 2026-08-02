import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SheetsAPI } from "../lib/sheets";

const CampaignContext = createContext(null);

// Powers the homepage hero banner, the top promo strip, and discounted
// pricing everywhere a price is shown. Set from Admin -> Banners &
// Offers — no code changes needed to switch occasions. When no
// campaign is Active (or the backend isn't configured yet), `campaign`
// is null and `discountPercent` is 0, so the site quietly falls back
// to plain prices and hides the banner/strip instead of showing a sale
// that isn't really live.
export function CampaignProvider({ children }) {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await SheetsAPI.getActiveCampaign();
      setCampaign(res.ok ? res.campaign : null);
    } catch {
      setCampaign(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const discountPercent = campaign?.discountPercent || 0;

  return (
    <CampaignContext.Provider value={{ campaign, discountPercent, loading, refresh }}>
      {children}
    </CampaignContext.Provider>
  );
}

export const useCampaign = () => useContext(CampaignContext);
