"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function useNavigation() {
  const router = useRouter();
  const { logout: authLogout } = useAuth();

  const logout = () => {
    // First clear auth state without redirect
    authLogout(false);
    // Then navigate using router
    router.push("/");
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const goBack = () => {
    router.back();
  };

  return {
    logout,
    navigateTo,
    goBack,
    router,
  };
}
