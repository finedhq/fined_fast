import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router-dom";
import { PageLoader } from "./PageLoader";

export const AuthenticationGuard = ({ component: Component, ...props }) => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  // For deployment without login system, comment out the redirection so all guarded pages are publicly accessible:
  // if (!isAuthenticated) {
  //   return <Navigate to="/" replace />;
  // }

  return <Component {...props} />;
};
