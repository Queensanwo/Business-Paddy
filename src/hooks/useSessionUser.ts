'use client';

import { useEffect, useState } from 'react';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  workspaceId: string;
  workspaceName: string;
  workspaceMode: 'DEMO' | 'LIVE';
}

export function useSessionUser() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/sign-in';
          throw new Error('Sign in required.');
        }
        if (!res.ok) throw new Error('Session request failed.');
        return res.json();
      })
      .then((data) => {
        setUser(data as SessionUser);
        setReady(true);
      })
      .catch(() => setReady(false));
  }, []);

  return { user, ready };
}

export function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    OWNER: 'Owner',
    MANAGER: 'Manager',
    AGENT: 'Agent',
    TRAINEE: 'Trainee',
  };
  return labels[role] ?? role;
}
