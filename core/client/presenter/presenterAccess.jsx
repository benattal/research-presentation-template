import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LIVE_SERVER, postJson } from '../live/liveApi.js';

const TOKEN_KEY = 'presenter-token';

const PresenterAccessContext = createContext(null);

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Presenter access on a live server: the presenter logs in with the
 * server's password and receives a token, kept in `localStorage` so every
 * window of the presenter's browser (audience view, presenter window) acts
 * as the presenter.
 */
function LivePresenterAccess({ children }) {
  const [token, setToken] = useState(readToken);

  useEffect(() => {
    function onStorage(event) {
      if (event.key === TOKEN_KEY) setToken(event.newValue);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback(async (password) => {
    try {
      const { token: received } = await postJson('auth/verify', { password });
      localStorage.setItem(TOKEN_KEY, received);
      setToken(received);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  const value = useMemo(() => ({
    isPresenter: token !== null,
    token,
    requiresLogin: true,
    login,
    logout,
  }), [token, login, logout]);

  return <PresenterAccessContext.Provider value={value}>{children}</PresenterAccessContext.Provider>;
}

const LOCAL_ACCESS = { isPresenter: true, token: null, requiresLogin: false, login: null, logout: null };

/**
 * Presenter access without a server: whoever runs the presentation locally
 * is the presenter, so there is nothing to log in to.
 */
function LocalPresenterAccess({ children }) {
  return <PresenterAccessContext.Provider value={LOCAL_ACCESS}>{children}</PresenterAccessContext.Provider>;
}

/** Provides `usePresenterAccess()` to the tree; chosen once by the hosting mode. */
export const PresenterAccessProvider = LIVE_SERVER ? LivePresenterAccess : LocalPresenterAccess;

/** `{ isPresenter, token, requiresLogin, login, logout }`. */
export function usePresenterAccess() {
  const access = useContext(PresenterAccessContext);
  if (!access) throw new Error('usePresenterAccess must be used inside PresenterAccessProvider');
  return access;
}
