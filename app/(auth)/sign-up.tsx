import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { GlobalStyles } from '@/styles/GlobalStyles';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput } from 'react-native';

export default function SignUpScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email.trim(), password, username.trim());
      // Navigation will be handled by the auth state change in AppContext
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={GlobalStyles.container}>
      <ThemedView style={GlobalStyles.content}>
        <ThemedView style={GlobalStyles.header}>
          <ThemedText type="title" style={GlobalStyles.title}>Create Account</ThemedText>
          <ThemedText style={GlobalStyles.subtitle}>Join CueView and start tracking your shows</ThemedText>
        </ThemedView>

        <ThemedView style={GlobalStyles.form}>
          <ThemedView style={GlobalStyles.inputGroup}>
            <ThemedText style={GlobalStyles.label}>Username</ThemedText>
            <TextInput
              style={GlobalStyles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a username"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </ThemedView>

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
              placeholder="Create a password (min 6 characters)"
              secureTextEntry
              autoCapitalize="none"
            />
          </ThemedView>

          <ThemedView style={GlobalStyles.inputGroup}>
            <ThemedText style={GlobalStyles.label}>Confirm Password</ThemedText>
            <TextInput
              style={GlobalStyles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              autoCapitalize="none"
            />
          </ThemedView>

          <Pressable 
            style={({ pressed }) => [
              GlobalStyles.primaryButton,
              pressed && GlobalStyles.buttonPressed,
              isLoading && GlobalStyles.disabledButton
            ]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            <Text style={GlobalStyles.primaryButtonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </Pressable>

          <ThemedView style={GlobalStyles.divider}>
            <ThemedText style={GlobalStyles.dividerText}>Already have an account?</ThemedText>
          </ThemedView>

          <Pressable 
            style={({ pressed }) => [
              GlobalStyles.secondaryButton,
              pressed && GlobalStyles.buttonPressed
            ]}
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            <Text style={GlobalStyles.secondaryButtonText}>Sign In</Text>
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
