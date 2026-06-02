"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { RecordModel } from "pocketbase";
import pb from "../lib/pocketbase";

interface AuthContextValue {
  user: RecordModel | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, username: string, password: string, passwordConfirm: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<RecordModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(pb.authStore.record ?? null);
    setLoading(false);
    const unsub = pb.authStore.onChange(() => {
      setUser(pb.authStore.record ?? null);
    });
    return () => unsub();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await pb.collection("users").authWithPassword(email, password);
    setUser(pb.authStore.record ?? null);
  }, []);

  const signUp = useCallback(
    async (email: string, username: string, password: string, passwordConfirm: string) => {
      await pb.collection("users").create({ email, username, password, passwordConfirm });
      await pb.collection("users").authWithPassword(email, password);
      setUser(pb.authStore.record ?? null);
    },
    []
  );

  const signOut = useCallback(() => {
    pb.authStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
