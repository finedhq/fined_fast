import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { fetchUserProfile, updateUserProfile } from "../services/api";

const UserProfileContext = createContext(null);

const DEFAULT_PROFILE = {
  display_name: "Rashi Karule",
  username: "rashi",
  email: "karulerashi@gmail.com",
  career_stage: "Student",
  financial_level: "Beginner (Level 1) - Starting with basics",
  bio: "Engineering student building daily personal finance & investing discipline 10 minutes a day on FinEd.",
  fin_score: 0,
  finscore: 0,
  fin_stars: 0,
  finstars: 0,
  streak_count: 0,
  streak: 0,
  rank: 1,
  ongoing_course: {
    id: "2936ac1c-1c2f-4c91-8ead-476f9bad635b",
    title: "Basics of Stock Market",
    slug: "basics-of-stock-market",
    current_lesson: 6,
    total_lessons: 12,
    progress_pct: 50,
  },
  consistency_grid: [
    0, 0, 3, 2, 0, 3, 1,
    3, 1, 0, 3, 3, 1, 0,
    2, 3, 1, 0, 3, 2, 3,
    3, 3, 3, 3, 3, 3, 3
  ]
};

export const UserProfileProvider = ({ children }) => {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [profile, setProfile] = useState(() => ({
    ...DEFAULT_PROFILE,
    display_name: user?.name || DEFAULT_PROFILE.display_name,
    email: user?.email || DEFAULT_PROFILE.email,
  }));
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
        setProfile((prev) => ({
          ...prev,
          ...data,
          display_name: data.full_name || data.display_name || user?.name || prev.display_name,
          email: data.email || user?.email || prev.email,
        }));
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
        setProfile((prev) => ({
          ...prev,
          ...updated,
          ...payload,
        }));
      } else {
        setProfile((prev) => ({
          ...prev,
          ...payload,
        }));
      }
      return true;
    } catch (err) {
      console.error("Failed to update profile:", err);
      // Still update locally for smooth UI experience
      setProfile((prev) => ({
        ...prev,
        ...payload,
      }));
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
