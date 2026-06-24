import { useEffect } from 'react';
import useAuthStore from '@/domains/auth/store/useAuthStore';

export function useRequireAuth() {
  const { currentUser, setShowMyPage } = useAuthStore();

  useEffect(() => {
    if (!currentUser) {
      setShowMyPage(false);
    }
  }, [currentUser, setShowMyPage]);

  return currentUser;
}
