import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { SheetsAPI } from "../lib/sheets";

const AddressContext = createContext(null);

// Same per-user local scoping approach as CartContext/WishlistContext,
// used as the demo-mode fallback so the address book still works
// end-to-end before the Google Sheets backend is wired up.
const addressKeyFor = (email) => `neobonn_addresses__${email ? email.toLowerCase() : "guest"}`;

function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function writeLocal(key, addresses) {
  try {
    localStorage.setItem(key, JSON.stringify(addresses));
  } catch {
    // storage full/unavailable — non-fatal, the in-memory list still works this session
  }
}

function makeLocalId() {
  return "addr_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

export function AddressProvider({ children }) {
  const { user } = useAuth();
  const email = user?.email || null;
  const localKey = addressKeyFor(email);

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const load = async () => {
    if (!email) {
      setAddresses([]);
      return;
    }
    setLoading(true);
    try {
      const res = await SheetsAPI.getMyAddresses(email);
      if (res.demo) {
        setDemoMode(true);
        setAddresses(readLocal(localKey));
      } else if (res.ok) {
        setDemoMode(false);
        setAddresses(res.addresses || []);
      } else {
        setAddresses([]);
      }
    } catch {
      // Backend unreachable — fall back to whatever's saved on this device.
      setDemoMode(true);
      setAddresses(readLocal(localKey));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  // Creates a new address, or updates one in place when addr.addressId
  // is given. The first address a customer ever saves — or any address
  // explicitly marked isDefault — becomes the one pre-selected at
  // checkout; every other saved address is un-defaulted to match.
  const saveAddress = async (addr) => {
    if (!email) return { ok: false, message: "Please sign in to save an address." };

    const isDefault = addr.isDefault ?? addresses.length === 0;
    const payload = { ...addr, email, isDefault };

    if (demoMode) {
      const now = new Date().toISOString();
      let saved;
      let next;
      if (addr.addressId) {
        next = addresses.map((a) => {
          if (a.addressId === addr.addressId) {
            saved = { ...a, ...payload, updatedAt: now };
            return saved;
          }
          return isDefault ? { ...a, isDefault: false } : a;
        });
      } else {
        saved = { ...payload, addressId: makeLocalId(), createdAt: now, updatedAt: now };
        next = isDefault ? addresses.map((a) => ({ ...a, isDefault: false })) : [...addresses];
        next = [...next, saved];
      }
      setAddresses(next);
      writeLocal(localKey, next);
      return { ok: true, demo: true, address: saved };
    }

    const res = await SheetsAPI.saveAddress(payload);
    if (res.ok) await load();
    return res;
  };

  const deleteAddress = async (addressId) => {
    if (!email) return { ok: false, message: "Please sign in first." };

    if (demoMode) {
      const wasDefault = addresses.find((a) => a.addressId === addressId)?.isDefault;
      let next = addresses.filter((a) => a.addressId !== addressId);
      if (wasDefault && next.length) {
        next = next.map((a, i) => ({ ...a, isDefault: i === 0 }));
      }
      setAddresses(next);
      writeLocal(localKey, next);
      return { ok: true, demo: true };
    }

    const res = await SheetsAPI.deleteAddress({ addressId, email });
    if (res.ok) await load();
    return res;
  };

  const setDefaultAddress = async (addressId) => {
    if (!email) return { ok: false, message: "Please sign in first." };

    if (demoMode) {
      const next = addresses.map((a) => ({ ...a, isDefault: a.addressId === addressId }));
      setAddresses(next);
      writeLocal(localKey, next);
      return { ok: true, demo: true };
    }

    const res = await SheetsAPI.setDefaultAddress({ addressId, email });
    if (res.ok) await load();
    return res;
  };

  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0] || null;

  return (
    <AddressContext.Provider
      value={{
        addresses,
        loading,
        demoMode,
        defaultAddress,
        saveAddress,
        deleteAddress,
        setDefaultAddress,
        reload: load,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
}

export const useAddresses = () => useContext(AddressContext);
