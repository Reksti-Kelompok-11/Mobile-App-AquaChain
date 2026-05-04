import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PageHeader } from '@/components/ui/page-header';

export default function JadwalScreen() {
  return (
    <ThemedView style={styles.screen}>
      <PageHeader 
        title="Jadwal Pakan" 
        subtitle="Pengaturan jadwal pakan ikan" 
        onPressRightIcon={() => alert('Menyegarkan notifikasi...')}
      />
      <View style={styles.content}>
        <ThemedText>Halaman jadwal bisa dipakai untuk atur penyiraman, feeding, atau pengingat.</ThemedText>
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