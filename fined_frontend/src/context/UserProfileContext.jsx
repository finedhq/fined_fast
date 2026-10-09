import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { fetchUserProfile, updateUserProfile } from "../services/api";

const UserProfileContext = createContext(null);

const DEFAULT_PROFILE = {
  display_name: "",
  username: "",
  email: "",
  career_stage: "Student",
  financial_level: "Beginner (Level 1) - Starting with basics",
  bio: "Building daily personal finance & investing discipline 10 minutes a day on FinEd.",
  location: "",
  fin_score: 0,
  finscore: 0,
  fin_stars: 0,
  finstars: 0,
  streak_count: 0,
  streak: 0,
  rank: 1,
  ongoing_course: null,
  consistency_grid: Array(28).fill(0),
};

const USER_PROFILE_CACHE_KEY = "fined_user_profile_cache_v2";

function getCachedProfile() {
  try {
    const raw = localStorage.getItem(USER_PROFILE_CACHE_KEY) || sessionStorage.getItem(USER_PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedProfile(data) {
  try {
    if (data && (data.email || data.display_name)) {
      const serialized = JSON.stringify(data);
      localStorage.setItem(USER_PROFILE_CACHE_KEY, serialized);
      sessionStorage.setItem(USER_PROFILE_CACHE_KEY, serialized);
    }
  } catch {
    // ignore
  }
}

export const UserProfileProvider = ({ children }) => {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [profile, setProfile] = useState(() => {
    const cached = getCachedProfile();
    return {
      ...DEFAULT_PROFILE,
      ...(cached || {}),
      display_name: cached?.display_name || user?.name || DEFAULT_PROFILE.display_name,
      email: cached?.email || user?.email || DEFAULT_PROFILE.email,
    };
  });
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      let token = null;
      try {
        token = await getAccessTokenSilently();
      } catch (tokErr) {
        console.warn("Could not get access token silently:", tokErr);
      }
      const data = await fetchUserProfile(token);
      if (data) {
        setProfile((prev) => {
          const next = {
            ...prev,
            ...data,
            display_name: data.full_name || data.display_name || user?.name || prev.display_name,
            email: data.email || user?.email || prev.email,
          };
          setCachedProfile(next);
          return next;
        });
      }
    } catch (err) {
      console.warn("Could not fetch remote user profile, using baseline data:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      refreshProfile();
    }
  }, [isAuthenticated, isLoading, refreshProfile]);

  const saveProfile = async (payload) => {
    try {
      let token = null;
      if (isAuthenticated) {
        try {
          token = await getAccessTokenSilently();
        } catch (tokErr) {
          console.warn("Could not get access token silently for save:", tokErr);
        }
      }
      const updated = await updateUserProfile(payload, token);
      if (updated) {
        setProfile((prev) => {
          const next = {
            ...prev,
            ...updated,
            ...payload,
          };
          setCachedProfile(next);
          return next;
        });
      } else {
        setProfile((prev) => {
          const next = {
            ...prev,
            ...payload,
          };
          setCachedProfile(next);
          return next;
        });
      }
      return true;
    } catch (err) {
      console.error("Failed to update profile:", err);
      // Still update locally for smooth UI experience
      setProfile((prev) => {
        const next = {
          ...prev,
          ...payload,
        };
        setCachedProfile(next);
        return next;
      });
      return true;
    }
  };

  const openEditModal = () => setIsEditModalOpen(true);
  const closeEditModal = () => setIsEditModalOpen(false);

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        loading,
        refreshProfile,
        saveProfile,
        isEditModalOpen,
        openEditModal,
        closeEditModal,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
};
