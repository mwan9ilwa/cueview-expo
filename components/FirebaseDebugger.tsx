import { db } from '@/config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FirebaseDebugger() {
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    setStatus('Testing Firebase connection...');

    try {
      // Test 1: Basic Firestore connection
      setStatus('Step 1: Testing Firestore initialization...');
      if (!db) {
        throw new Error('Firestore not initialized');
      }
      setStatus('✓ Firestore initialized successfully');

      // Test 2: Try to create a reference to a collection
      setStatus('Step 2: Creating collection reference...');
      const testCollection = collection(db, 'test');
      setStatus('✓ Collection reference created');

      // Test 3: Try to read from the collection (this makes the actual network request)
      setStatus('Step 3: Attempting to read from Firestore...');
      const querySnapshot = await getDocs(testCollection);
      setStatus(`✓ Firestore connection successful! Found ${querySnapshot.size} documents`);

    } catch (error: any) {
      console.error('Firebase test error:', error);
      setError(error.message || 'Unknown error');
      
      // Detailed error analysis
      if (error.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
        setStatus('❌ Request blocked by browser extension');
        setError('Browser extension (likely ad blocker) is blocking Firebase requests. Try:\n' +
                '• Disable ad blockers for this site\n' +
                '• Use incognito/private mode\n' +
                '• Whitelist firestore.googleapis.com');
      } else if (error.code === 'permission-denied') {
        setStatus('❌ Permission denied');
        setError('Firestore security rules are denying access. Check your Firebase console.');
      } else if (error.code === 'unavailable') {
        setStatus('❌ Service unavailable');
        setError('Cannot connect to Firestore. Check your internet connection.');
      } else {
        setStatus('❌ Connection failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Connection Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.status}>{status}</Text>
        {error && (
          <Text style={styles.error}>{error}</Text>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testConnection}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Again'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusContainer: {
    marginVertical: 10,
  },
  status: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  error: {
    fontSize: 12,
    color: '#d32f2f',
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 4,
    marginTop: 5,
  },
  button: {
    backgroundColor: '#2196f3',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
