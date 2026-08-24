import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Linking } from 'react-native';
import { supabase } from '../services/supabase';
import type { Session } from '@supabase/supabase-js';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  recovering: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Must match the `scheme` configured in apps/mobile/app.json.
const RESET_REDIRECT = 'peepoo://reset-password';

/**
 * Parse query/hash params out of a deep-link URL. Supabase may deliver the
 * recovery token as `?code=...` (PKCE) or `#access_token=...&refresh_token=...`
 * (implicit flow), so we support both.
 */
function parseAuthParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const body = url.replace(/^[^?#]*[?#]/, '');
  for (const part of body.split('&')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      try {
        params[decodeURIComponent(part.slice(0, idx))] = decodeURIComponent(
          part.slice(idx + 1),
        );
      } catch {
        // Ignore malformed params.
      }
    }
  }
  return params;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);
  const handledUrl = useRef<string | null>(null);

  const handleRecoveryUrl = useCallback(async (url: string) => {
    if (!url.startsWith(RESET_REDIRECT)) return;
    // Avoid double-processing the same link (initial URL + 'url' event).
    if (handledUrl.current === url) return;
    handledUrl.current = url;

    const params = parseAuthParams(url);
    const code = params.code;
    const accessToken = params.access_token;
    const refreshToken = params.refresh_token;

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) setRecovering(true);
    } else if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (!error) setRecovering(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);

      // Handle a cold-start password-recovery deep link before revealing UI.
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) await handleRecoveryUrl(initialUrl);

      if (mounted) setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    // Handle password-recovery deep links while the app is running.
    const linkSub = Linking.addEventListener('url', ({ url }) => {
      void handleRecoveryUrl(url);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      linkSub.remove();
    };
  }, [handleRecoveryUrl]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    setRecovering(false);
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: RESET_REDIRECT,
    });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setRecovering(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        recovering,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
