import { Navigate } from "react-router-dom";

export default function RequireAdmin({ children }) {
  const isAdmin = sessionStorage.getItem("neobonn_admin") === "true";
  if (!isAdmin) return <Navigate to="/admin" replace />;
  return children;
}
