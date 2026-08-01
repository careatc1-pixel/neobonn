import { Navigate } from "react-router-dom";
import { ADMIN_LOGIN_PATH } from "../../App";

export default function RequireAdmin({ children }) {
  const isAdmin = sessionStorage.getItem("neobonn_admin") === "true";
  if (!isAdmin) return <Navigate to={ADMIN_LOGIN_PATH} replace />;
  return children;
}
