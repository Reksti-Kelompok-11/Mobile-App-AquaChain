import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function MonitorScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Monitor</ThemedText>
      <ThemedText>Halaman monitor siap diisi dengan data perangkat dan status sensor.</ThemedText>
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