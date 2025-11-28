"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

const AuthContext = createContext({
  user: null,
  setUser: (_user: any) => {},
});

export function AuthProvider({ children }: any) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Load initial user from Supabase (client side)
    supabaseClient.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });

    // Listen for login/logout in real-time
    const { data: listener } = supabaseClient.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
