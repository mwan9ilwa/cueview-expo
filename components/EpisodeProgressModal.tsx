import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface EpisodeProgressModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: (season: number, episode: number) => void;
  showName: string;
  currentSeason?: number;
  currentEpisode?: number;
}

export default function EpisodeProgressModal({
  visible,
  onClose,
  onUpdate,
  showName,
  currentSeason = 1,
  currentEpisode = 1,
}: EpisodeProgressModalProps) {
  const [season, setSeason] = useState(() => {
    const seasonNum = currentSeason || 1;
    return seasonNum.toString();
  });
  const [episode, setEpisode] = useState(() => {
    const episodeNum = currentEpisode || 1;
    return episodeNum.toString();
  });

  const handleUpdate = () => {
    const seasonNum = parseInt(season);
    const episodeNum = parseInt(episode);

    if (isNaN(seasonNum) || isNaN(episodeNum) || seasonNum < 1 || episodeNum < 1) {
      Alert.alert('Invalid Input', 'Please enter valid season and episode numbers.');
      return;
    }

    onUpdate(seasonNum, episodeNum);
    onClose();
  };

  const handleClose = () => {
    // Reset to current values when closing
    const seasonNum = currentSeason || 1;
    const episodeNum = currentEpisode || 1;
    setSeason(seasonNum.toString());
    setEpisode(episodeNum.toString());
    onClose();
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
            Update Progress
          </ThemedText>
          
          <ThemedText style={styles.showName}>
            {showName}
          </ThemedText>

          <View style={styles.inputContainer}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Season</ThemedText>
              <TextInput
                style={styles.input}
                value={season}
                onChangeText={setSeason}
                keyboardType="numeric"
                placeholder="1"
                selectTextOnFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Episode</ThemedText>
              <TextInput
                style={styles.input}
                value={episode}
                onChangeText={setEpisode}
                keyboardType="numeric"
                placeholder="1"
                selectTextOnFocus
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
              <ThemedText style={styles.updateButtonText}>Update</ThemedText>
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
  inputContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
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
  updateButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
