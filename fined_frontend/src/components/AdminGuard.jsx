import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router-dom";
import { PageLoader } from "./PageLoader";
import { isAdminUser } from "../services/auth";

export const AdminGuard = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Admin role check
  if (!isAdminUser(user)) {
    // If authenticated but not admin, kick back to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
