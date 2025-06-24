import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import React, { Component, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ThemedView style={styles.container}>
          <View style={styles.errorContent}>
            <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#FF3B30" />
            <ThemedText style={styles.errorTitle}>Something went wrong</ThemedText>
            <ThemedText style={styles.errorMessage}>
              We&apos;re sorry, but something unexpected happened. Please try restarting the app.
            </ThemedText>
            {__DEV__ && this.state.error && (
              <ThemedText style={styles.errorDetails}>
                {this.state.error.message}
              </ThemedText>
            )}
          </View>
        </ThemedView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContent: {
    alignItems: 'center',
    gap: 16,
    maxWidth: 300,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FF3B30',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
  },
  errorDetails: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.6,
    fontFamily: 'monospace',
    marginTop: 8,
  },
});

export default ErrorBoundary;
