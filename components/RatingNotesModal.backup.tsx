import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface RatingNotesModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (rating?: number, notes?: string) => void;
  showName: string;
  currentRating?: number;
  currentNotes?: string;
}

export default function RatingNotesModal({
  visible,
  onClose,
  onSave,
  showName,
  currentRating,
  currentNotes,
}: RatingNotesModalProps) {
  
  console.log('RatingNotesModal props:', { 
    visible, 
    showName, 
    currentRating, 
    currentNotes: currentNotes ? currentNotes.length : 'null/undefined' 
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={styles.modal}>
          <ThemedText type="subtitle" style={styles.title}>
            Debug Modal
          </ThemedText>
          
          <ThemedText style={styles.showName}>
            {showName || 'No show name'}
          </ThemedText>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ThemedText style={styles.closeButtonText}>Close</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  showName: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
