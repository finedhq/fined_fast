import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { setTokenFetcher } from "../lib/axios";

export const ApiTokenProvider = ({ children }) => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  useEffect(() => {
    // We pass the bound getAccessTokenSilently function to our axios instance
    // so that it can fetch a fresh token before every request.
    setTokenFetcher(isAuthenticated ? getAccessTokenSilently : null);
  }, [getAccessTokenSilently, isAuthenticated]);

  return children;
};
