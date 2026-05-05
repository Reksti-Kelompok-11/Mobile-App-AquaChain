import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PageHeader } from '@/components/ui/page-header';

export default function JadwalScreen() {
  const [isFeederOn, setIsFeederOn] = useState(true);

  return (
    <ThemedView style={styles.screen}>
      <PageHeader 
        title="Jadwal Pakan" 
        subtitle="Pengaturan jadwal pakan ikan" 
        onPressRightIcon={() => alert('Menyegarkan notifikasi...')}
      >
        <View style={styles.feederCard}>
          <View style={styles.feederLeft}>
            <View
              style={[styles.feederDot, !isFeederOn && styles.feederDotOff]}
            />
            <View>
              <ThemedText style={styles.feederTitle}>Auto-Feeder Sistem</ThemedText>
              <ThemedText style={styles.feederSubtitle}>Total pakan hari ini: 25.5 kg</ThemedText>
            </View>
          </View>
          <View style={styles.switchWrap}>
            <Switch
              value={isFeederOn}
              onValueChange={setIsFeederOn}
              trackColor={{ false: 'rgba(255, 255, 255, 0.25)', true: '#4BE37A' }}
              thumbColor={isFeederOn ? '#FFFFFF' : '#E6E6E6'}
            />
          </View>
        </View>
      </PageHeader>
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
  feederCard: {
    marginTop: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feederLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  feederDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#35D07A',
  },
  feederDotOff: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  feederTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  feederSubtitle: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 12,
    marginTop: 2,
  },
  switchWrap: {
    height: 34,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});