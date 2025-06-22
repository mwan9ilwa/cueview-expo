import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Redirect } from 'expo-router';
import React from 'react';

export default function IndexScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('🏠 Index screen render:', {
    isAuthenticated,
    isLoading,
    user: user ? { id: user.id, email: user.email, username: user.username } : null,
    timestamp: new Date().toISOString()
  });

  // Show loading screen while checking authentication
  if (isLoading) {
    console.log('⏳ Showing loading screen');
    return <LoadingScreen />;
  }

  // Redirect based on authentication state
  if (isAuthenticated && user) {
    console.log('🔓 User authenticated, redirecting to tabs:', user.email);
    return <Redirect href="/(tabs)" />;
  } else {
    console.log('🔒 User not authenticated, redirecting to welcome. Auth state:', { isAuthenticated, hasUser: !!user });
    return <Redirect href="/(auth)/welcome" />;
  }
}
