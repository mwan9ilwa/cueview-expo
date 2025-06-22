import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
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
  // Ensure we have safe defaults for all props
  const safeShowName = showName || 'Unknown Show';
  const safeCurrentNotes = currentNotes || '';
  
  const [rating, setRating] = useState<number | undefined>(currentRating);
  const [notes, setNotes] = useState(safeCurrentNotes);

  // Update state when props change
  useEffect(() => {
    setRating(currentRating);
    setNotes(safeCurrentNotes);
  }, [currentRating, safeCurrentNotes]);

  const handleSave = () => {
    onSave(rating, (notes || '').trim() || undefined);
    onClose();
  };

  const handleClose = () => {
    // Reset to current values when closing
    setRating(currentRating);
    setNotes(safeCurrentNotes);
    onClose();
  };

  const handleStarPress = (star: number) => {
    setRating(rating === star ? undefined : star);
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleStarPress(star)}
            style={styles.starButton}
          >
            <ThemedText style={[
              styles.star,
              rating && star <= rating ? styles.starFilled : null
            ]}>
              ⭐
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={styles.modal}>
          <ThemedText type="subtitle" style={styles.title}>
            Rate & Review
          </ThemedText>
          
          <ThemedText style={styles.showName}>
            {safeShowName}
          </ThemedText>

          {/* Rating Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Rating</ThemedText>
            {renderStars()}
            <ThemedText style={styles.ratingHint}>
              Tap to rate • Tap again to remove
            </ThemedText>
          </View>

          {/* Notes Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
            <TextInput
              style={styles.notesInput}
              value={notes || ''}
              onChangeText={setNotes}
              placeholder="Add your thoughts about this show..."
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <ThemedText style={styles.characterCount}>
              {(notes || '').length}/500
            </ThemedText>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <ThemedText style={styles.saveButtonText}>Save</ThemedText>
            </TouchableOpacity>
          </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 28,
    opacity: 0.3,
  },
  starFilled: {
    opacity: 1,
  },
  ratingHint: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.6,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 100,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
