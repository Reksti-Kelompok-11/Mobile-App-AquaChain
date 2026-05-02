import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function JadwalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Jadwal</ThemedText>
      <ThemedText>Halaman jadwal bisa dipakai untuk atur penyiraman, feeding, atau pengingat.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
});