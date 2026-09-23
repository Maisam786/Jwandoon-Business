import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { getUserProfile } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setUser(null);
    setProfile(null);
  }

  async function loadSession() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setUser(null);
        setProfile(null);
        return;
      }

      setUser(session.user);

      try {
        const userProfile = await getUserProfile(session.user.id);

        if (!userProfile.active) {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          return;
        }

        setProfile(userProfile);
      } catch (error) {
        console.error("Failed to load user profile:", error);

        await supabase.auth.signOut();

        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error("Failed to load authentication session:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(session.user);

      try {
        const userProfile = await getUserProfile(session.user.id);

        if (!userProfile.active) {
          await supabase.auth.signOut();

          setUser(null);
          setProfile(null);

          return;
        }

        setProfile(userProfile);
      } catch (error) {
        console.error("Failed to load profile:", error);

        await supabase.auth.signOut();

        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthenticated: !!user && !!profile,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
