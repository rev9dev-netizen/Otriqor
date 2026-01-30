import { useEffect, useState } from 'react';
import { createClient } from '../supabase/client';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
      } else {
        // Try anonymous sign in required for RLS to work without full login
        // Note: You must enable "Anonymous Sign-in" in Supabase Dashboard -> Auth -> Providers
        const { data, error } = await supabase.auth.signInAnonymously();
        if (data.user) {
            setUser(data.user);
        } else {
            console.warn("Anonymous sign-in failed. You may need to enable it in Supabase or log in manually.", error);
        }
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
