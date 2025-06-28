import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { GlobalStyles } from '@/styles/GlobalStyles';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput } from 'react-native';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, isAuthenticated, user } = useAuth();

  // Monitor auth state changes
  React.useEffect(() => {
    console.log('👀 Sign-in screen - Auth state changed:', { isAuthenticated, hasUser: !!user, userEmail: user?.email });
    if (isAuthenticated && user) {
      console.log('🚀 User is authenticated on sign-in screen, should redirect soon');
    }
  }, [isAuthenticated, user]);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    console.log('🔐 Sign in attempt started for:', email.trim());
    setIsLoading(true);
    try {
      console.log('🔄 Calling signIn function...');
      await signIn(email.trim(), password);
      console.log('✅ signIn function completed successfully');
      // Navigation will be handled by the auth state change in AppContext
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      Alert.alert('Error', error.message || 'Failed to sign in');
    } finally {
      console.log('🏁 Sign in attempt finished, loading set to false');
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={GlobalStyles.container}>
      <ThemedView style={GlobalStyles.content}>
        <ThemedView style={GlobalStyles.header}>
          <ThemedText type="title" style={GlobalStyles.title}>CueView</ThemedText>
          <ThemedText style={GlobalStyles.subtitle}>Sign in to your account</ThemedText>
        </ThemedView>

        <ThemedView style={GlobalStyles.form}>
          <ThemedView style={GlobalStyles.inputGroup}>
            <ThemedText style={GlobalStyles.label}>Email</ThemedText>
            <TextInput
              style={GlobalStyles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </ThemedView>

          <ThemedView style={GlobalStyles.inputGroup}>
            <ThemedText style={GlobalStyles.label}>Password</ThemedText>
            <TextInput
              style={GlobalStyles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
            />
          </ThemedView>

          <Pressable 
            style={GlobalStyles.link}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <ThemedText style={GlobalStyles.linkText}>Forgot Password?</ThemedText>
          </Pressable>

          <Pressable 
            style={({ pressed }) => [
              GlobalStyles.primaryButton,
              pressed && GlobalStyles.buttonPressed,
              isLoading && GlobalStyles.disabledButton
            ]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            <Text style={GlobalStyles.primaryButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </Pressable>

          <ThemedView style={GlobalStyles.divider}>
            <ThemedText style={GlobalStyles.dividerText}>Don&apos;t have an account?</ThemedText>
          </ThemedView>

          <Pressable 
            style={({ pressed }) => [
              GlobalStyles.secondaryButton,
              pressed && GlobalStyles.buttonPressed
            ]}
            onPress={() => router.replace('/(auth)/sign-up')}
          >
            <Text style={GlobalStyles.secondaryButtonText}>Create Account</Text>
          </Pressable>
        </ThemedView>

        <Pressable 
          style={GlobalStyles.backButton}
          onPress={() => router.back()}
        >
          <ThemedText style={GlobalStyles.backText}>← Back</ThemedText>
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

