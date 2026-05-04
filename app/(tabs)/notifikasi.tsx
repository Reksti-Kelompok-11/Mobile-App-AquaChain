import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PageHeader } from '@/components/ui/page-header';

export default function NotifikasiScreen() {
  return (
    <ThemedView style={styles.screen}>
      <PageHeader
        title="Notifikasi"
        subtitle="Peringatan dan Info Sistem"
        rightActionLabel="Baca Semua"
        onPressRightAction={() => alert('Semua notifikasi ditandai sudah dibaca.')}
        onPressRightIcon={() => alert('Menyegarkan notifikasi...')}
      />
      <View style={styles.content}>
        <ThemedText>Halaman notifikasi siap menampung alert, status alarm, dan pesan sistem.</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  content: {
    padding: 24,
    gap: 12,
  },
});