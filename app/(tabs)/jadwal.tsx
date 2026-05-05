import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AddScheduleCard } from '@/components/ui/jadwal/add-schedule-card';
import { ScheduleListCard } from '@/components/ui/jadwal/schedule-list-card';
import { PageHeader } from '@/components/ui/page-header';

export default function JadwalScreen() {
  const [isFeederOn, setIsFeederOn] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [kolamValue, setKolamValue] = useState('Kolam A1');
  const [waktuValue, setWaktuValue] = useState('07:00 AM');

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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => setShowAddCard((prev) => !prev)}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <MaterialIcons name="add" size={18} color="#FFFFFF" />
            <ThemedText style={styles.primaryButtonText}>Tambah Jadwal</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => alert('Membuka kalkulator pakan.')}
            style={({ pressed }) => [
              styles.outlineButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <MaterialIcons name="calculate" size={18} color="#2F7BFF" />
            <ThemedText style={styles.outlineButtonText}>Kalkulator</ThemedText>
          </Pressable>
        </View>
        {showAddCard && (
          <AddScheduleCard
            kolamValue={kolamValue}
            waktuValue={waktuValue}
            onChangeKolam={setKolamValue}
            onChangeWaktu={setWaktuValue}
            onSave={() => {
              alert('Jadwal disimpan.');
              setShowAddCard(false);
            }}
            onCancel={() => setShowAddCard(false)}
          />
        )}
        <ScheduleListCard />
      </ScrollView>
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
    paddingBottom: 32,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#2F7BFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  outlineButton: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2F7BFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  outlineButtonText: {
    color: '#2F7BFF',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
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