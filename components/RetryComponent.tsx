import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface RetryComponentProps {
  message?: string;
  onRetry: () => void;
  loading?: boolean;
  showIcon?: boolean;
  style?: any;
}

export default function RetryComponent({
  message = 'Something went wrong. Please try again.',
  onRetry,
  loading = false,
  showIcon = true,
  style,
}: RetryComponentProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      {showIcon && (
        <IconSymbol 
          name="wifi.exclamationmark" 
          size={32} 
          color="#FF3B30" 
        />
      )}
      <ThemedText style={styles.message}>{message}</ThemedText>
      <TouchableOpacity
        style={[styles.retryButton, loading && styles.disabledButton]}
        onPress={onRetry}
        disabled={loading}
      >
        <View style={styles.buttonContent}>
          {loading ? (
            <>
              <IconSymbol name="arrow.clockwise" size={16} color="white" />
              <ThemedText style={styles.buttonText}>Retrying...</ThemedText>
            </>
          ) : (
            <>
              <IconSymbol name="arrow.clockwise" size={16} color="white" />
              <ThemedText style={styles.buttonText}>Try Again</ThemedText>
            </>
          )}
        </View>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.8,
    lineHeight: 22,
    maxWidth: 280,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
