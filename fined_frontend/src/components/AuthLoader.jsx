import { useAuth0 } from "@auth0/auth0-react";
import { PageLoader } from "./PageLoader";

export const AuthLoader = ({ children }) => {
  const { isLoading } = useAuth0();

  if (isLoading) {
    return <PageLoader />;
  }

  return children;
};
