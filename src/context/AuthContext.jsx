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
    try {
      const res = await SheetsAPI.login({ email, password });
      if (res.demo) {
        // Demo mode fallback so the site is usable before Sheets is wired up
        const fake = { name: email.split("@")[0], email };
        persist(fake);
        return { ok: true, demo: true };
      }
      if (res.ok) persist(res.user);
      return res;
    } catch (err) {
      // SheetsAPI throws on network/HTTP failures (e.g. a misconfigured
      // backend URL) — surface it as a normal {ok:false} result instead
      // of an unhandled promise rejection.
      return { ok: false, message: err.message || "Could not sign in. Please try again." };
    }
  };

  const signup = async (name, email, phone, password) => {
    try {
      const res = await SheetsAPI.signup({ name, email, phone, password });
      if (res.demo) {
        const fake = { name, email, phone };
        persist(fake);
        return { ok: true, demo: true };
      }
      if (res.ok) persist(res.user);
      return res;
    } catch (err) {
      return { ok: false, message: err.message || "Could not create your account. Please try again." };
    }
  };

  const requestOtp = async (email, purpose) => {
    try {
      const res = await SheetsAPI.sendOtp(email, purpose);
      if (res.demo) return { ok: true, demo: true };
      return res;
    } catch (err) {
      return { ok: false, message: err.message || "Could not send the code. Please try again." };
    }
  };

  const loginWithOtp = async (email, otp) => {
    try {
      const res = await SheetsAPI.verifyOtpLogin(email, otp);
      if (res.demo) {
        const fake = { name: email.split("@")[0], email };
        persist(fake);
        return { ok: true, demo: true };
      }
      if (res.ok) persist(res.user);
      return res;
    } catch (err) {
      return { ok: false, message: err.message || "Could not verify the code. Please try again." };
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
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
    } catch (err) {
      return { ok: false, message: err.message || "Google sign-in failed. Please try again." };
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const res = await SheetsAPI.resetPasswordWithOtp({ email, otp, newPassword });
      if (res.demo) return { ok: true, demo: true };
      return res;
    } catch (err) {
      return { ok: false, message: err.message || "Could not reset your password. Please try again." };
    }
  };

  const logout = () => persist(null);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, requestOtp, loginWithOtp, loginWithGoogle, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    console.error("useAuth() called outside <AuthProvider> — auth data unavailable.");
    return {
      user: null,
      login: async () => ({ ok: false, message: "Auth service unavailable." }),
      signup: async () => ({ ok: false, message: "Auth service unavailable." }),
      logout: () => {},
      requestOtp: async () => ({ ok: false, message: "Auth service unavailable." }),
      loginWithOtp: async () => ({ ok: false, message: "Auth service unavailable." }),
      loginWithGoogle: async () => ({ ok: false, message: "Auth service unavailable." }),
      resetPassword: async () => ({ ok: false, message: "Auth service unavailable." }),
    };
  }
  return ctx;
};
