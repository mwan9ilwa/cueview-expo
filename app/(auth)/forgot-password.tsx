import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { GlobalStyles } from '@/styles/GlobalStyles';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput } from 'react-native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email.trim());
      Alert.alert(
        'Success', 
        'Password reset email sent! Check your inbox for instructions.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={GlobalStyles.container}>
      <ThemedView style={GlobalStyles.content}>
        <ThemedView style={GlobalStyles.header}>
          <ThemedText type="title" style={GlobalStyles.title}>Reset Password</ThemedText>
          <ThemedText style={GlobalStyles.subtitle}>Enter your email address and we&apos;ll send you a link to reset your password</ThemedText>
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

          <Pressable 
            style={({ pressed }) => [
              GlobalStyles.primaryButton,
              pressed && GlobalStyles.buttonPressed,
              isLoading && GlobalStyles.disabledButton
            ]}
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            <Text style={GlobalStyles.primaryButtonText}>
              {isLoading ? 'Sending...' : 'Send Reset Email'}
            </Text>
          </Pressable>
        </ThemedView>

        <ThemedView style={GlobalStyles.footer}>
          <Pressable onPress={() => router.back()}>
            <ThemedText style={GlobalStyles.linkText}>Back to Sign In</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}
