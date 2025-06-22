import FirebaseDebugger from '@/components/FirebaseDebugger';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SimpleTest() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>CueView Test Screen</Text>
        <Text style={styles.subtext}>Basic app is working!</Text>
        
        <FirebaseDebugger />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtext: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
  },
});
