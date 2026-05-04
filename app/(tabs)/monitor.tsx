import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { KolamSelector } from '@/components/ui/kolam-selector';
import { PageHeader } from '@/components/ui/page-header';

export default function MonitorScreen() {
  return (
    <ThemedView style={styles.screen}>
      <PageHeader 
        title="Monitor Air" 
        subtitle="Pemantauan Kualitas Air Real Time"
        onPressRightIcon={() => alert('Menyegarkan notifikasi...')}
      >
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <MaterialIcons name="check" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.statusTextWrap}>
            <ThemedText style={styles.statusTitle}>Kondisi Aman</ThemedText>
            <ThemedText style={styles.statusSubtitle}>Kolam A1 - Diperbarui 3 menit lalu</ThemedText>
          </View>
        </View>
      </PageHeader>
      <KolamSelector />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  statusCard: {
    backgroundColor: '#BFFFA4',
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2BBE5D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextWrap: {
    flex: 1,
  },
  statusTitle: {
    color: '#1D7A3B',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: -7,
  },
  statusSubtitle: {
    color: '#3C7A52',
    fontSize: 10,
    fontWeight: '500',
  },
});