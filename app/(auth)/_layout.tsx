import { useAuth } from '@/contexts/SimpleAuthContext';
import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';

export default function AuthLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    console.log('🔐 Auth Layout - Auth state:', { isAuthenticated, isLoading, hasUser: !!user });
  }, [isAuthenticated, isLoading, user]);

  // If user is authenticated, redirect to main app
  if (!isLoading && isAuthenticated && user) {
    console.log('🔀 Auth Layout: User authenticated, redirecting to tabs');
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
