import { createContext, useContext, useState } from "react";
import { SheetsAPI } from "../lib/sheets";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("neobonn_user") || "null");
    } catch {
      return null;
    }
  });

  const persist = (u) => {
    setUser(u);
    if (u) localStorage.setItem("neobonn_user", JSON.stringify(u));
    else localStorage.removeItem("neobonn_user");
  };

  const login = async (email, password) => {
    const res = await SheetsAPI.login({ email, password });
    if (res.demo) {
      // Demo mode fallback so the site is usable before Sheets is wired up
      const fake = { name: email.split("@")[0], email };
      persist(fake);
      return { ok: true, demo: true };
    }
    if (res.ok) persist(res.user);
    return res;
  };

  const signup = async (name, email, phone, password) => {
    const res = await SheetsAPI.signup({ name, email, phone, password });
    if (res.demo) {
      const fake = { name, email, phone };
      persist(fake);
      return { ok: true, demo: true };
    }
    if (res.ok) persist(res.user);
    return res;
  };

  const requestOtp = async (email, purpose) => {
    const res = await SheetsAPI.sendOtp(email, purpose);
    if (res.demo) return { ok: true, demo: true };
    return res;
  };

  const loginWithOtp = async (email, otp) => {
    const res = await SheetsAPI.verifyOtpLogin(email, otp);
    if (res.demo) {
      const fake = { name: email.split("@")[0], email };
      persist(fake);
      return { ok: true, demo: true };
    }
    if (res.ok) persist(res.user);
    return res;
  };

  const loginWithGoogle = async (credential) => {
    const res = await SheetsAPI.loginWithGoogle(credential);
    if (res.demo) {
      // Demo mode fallback: decode the Google JWT locally just to get a
      // name/email so the site is usable before Sheets is wired up.
      try {
        const payload = JSON.parse(atob(credential.split(".")[1]));
        const fake = { name: payload.name || payload.email.split("@")[0], email: payload.email };
        persist(fake);
        return { ok: true, demo: true };
      } catch {
        return { ok: false, message: "Could not read Google account details." };
      }
    }
    if (res.ok) persist(res.user);
    return res;
  };

  const resetPassword = async (email, otp, newPassword) => {
    const res = await SheetsAPI.resetPasswordWithOtp({ email, otp, newPassword });
    if (res.demo) return { ok: true, demo: true };
    return res;
  };

  const logout = () => persist(null);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, requestOtp, loginWithOtp, loginWithGoogle, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
