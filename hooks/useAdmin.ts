'use client';

import { useState, useEffect, useCallback } from 'react';

interface AdminState {
  isAdmin: boolean;
  isLoading: boolean;
}

export function useAdmin() {
  const [state, setState] = useState<AdminState>({
    isAdmin: false,
    isLoading: true,
  });

  const checkAdminStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth');
      if (res.ok) {
        const data = await res.json();
        setState({ isAdmin: data.isAdmin, isLoading: false });
      } else {
        setState({ isAdmin: false, isLoading: false });
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setState({ isAdmin: false, isLoading: false });
    }
  }, []);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  const login = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        setState({ isAdmin: true, isLoading: false });
        return { success: true };
      } else {
        const error = await res.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      return { success: false, error: '네트워크 오류가 발생했습니다.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      setState({ isAdmin: false, isLoading: false });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return {
    isAdmin: state.isAdmin,
    isLoading: state.isLoading,
    login,
    logout,
    refresh: checkAdminStatus,
  };
}
