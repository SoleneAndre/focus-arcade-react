import { createContext, useContext, useEffect, useState } from "react";

export type Profile = { id: string; name: string };

const ProfileCtx = createContext<{
  profile: Profile;
  setProfile: (p: Profile) => void;
  profiles: Profile[];
  addProfile: (name: string) => void;
  removeProfile: (id: string) => void;
}>({
  profile: { id: "default", name: "Démo" },
  setProfile: () => {},
  profiles: [],
  addProfile: () => {},
  removeProfile: () => {},
});

const KEY = "fa_profiles_v1";
const ACTIVE = "fa_profile_active_v1";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [{ id: "default", name: "Démo" }];
    try {
      const p = JSON.parse(raw) as Profile[];
      return p.length ? p : [{ id: "default", name: "Démo" }];
    } catch {
      return [{ id: "default", name: "Démo" }];
    }
  });

  const [profile, setProfile] = useState<Profile>(() => {
    const id = localStorage.getItem(ACTIVE) || "default";
    const p = profiles.find((x) => x.id === id) || profiles[0];
    return p;
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(profiles));
    if (!profiles.find((p) => p.id === profile.id)) {
      setProfile(profiles[0]);
    }
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem(ACTIVE, profile.id);
  }, [profile]);

  function addProfile(name: string) {
    const p = { id: uid(), name: name.trim() || "Sans nom" };
    setProfiles((prev) => [...prev, p]);
    setProfile(p);
  }

  function removeProfile(id: string) {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <ProfileCtx.Provider value={{ profile, setProfile, profiles, addProfile, removeProfile }}>
      {children}
    </ProfileCtx.Provider>
  );
}

export const useProfile = () => useContext(ProfileCtx);
