import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function NotifikasiScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Notifikasi</ThemedText>
      <ThemedText>Halaman notifikasi siap menampung alert, status alarm, dan pesan sistem.</ThemedText>
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