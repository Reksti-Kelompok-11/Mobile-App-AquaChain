import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AddScheduleCard } from '@/components/ui/jadwal/add-schedule-card';
import { ScheduleListCard, type ScheduleItem, type ScheduleSection } from '@/components/ui/jadwal/schedule-list-card';
import { PageHeader } from '@/components/ui/page-header';
import { api, type FeederSchedule, type Pond } from '@/src/api';

type PondRow = Pond;
type ScheduleRow = FeederSchedule;

type SectionId = 'morning' | 'noon' | 'evening' | 'night';

const SECTION_META: Record<SectionId, Omit<ScheduleSection, 'items'>> = {
  morning: {
    id: 'morning',
    title: 'Pagi Hari',
    iconName: 'wb-sunny',
    iconColor: '#F5A623',
    iconBg: '#FFF1D6',
  },
  noon: {
    id: 'noon',
    title: 'Siang Hari',
    iconName: 'wb-sunny',
    iconColor: '#F2A116',
    iconBg: '#FFE9C9',
  },
  evening: {
    id: 'evening',
    title: 'Sore Hari',
    iconName: 'timelapse',
    iconColor: '#E67E22',
    iconBg: '#FFE0C2',
  },
  night: {
    id: 'night',
    title: 'Malam Hari',
    iconName: 'brightness-2',
    iconColor: '#4F46E5',
    iconBg: '#E0E7FF',
  },
};

function getSectionId(hour: number): SectionId {
  if (hour >= 4 && hour <= 10) return 'morning';
  if (hour >= 11 && hour <= 15) return 'noon';
  if (hour >= 16 && hour <= 19) return 'evening';
  return 'night';
}

function formatScheduleTime(value: string | null) {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

function buildScheduleTimestamp(timeValue: string) {
  const match = timeValue.match(/^(\d{1,2}):(\d{2})$/);
  const date = new Date();
  if (match) {
    const hours = Math.min(23, Math.max(0, Number(match[1])));
    const minutes = Math.min(59, Math.max(0, Number(match[2])));
    date.setHours(hours, minutes, 0, 0);
  }
  return date;
}

function createLocalId() {
  return `schedule-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseDosage(value: string) {
  const normalized = value.replace(',', '.').trim();
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}

export default function JadwalScreen() {
  const [isFeederOn, setIsFeederOn] = useState(true);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [ponds, setPonds] = useState<PondRow[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [selectedPondId, setSelectedPondId] = useState<string | null>(null);
  const [waktuValue, setWaktuValue] = useState('07:00');
  const [dosageValue, setDosageValue] = useState('');

  const pondOptions = useMemo(
    () =>
      ponds.map((pond) => ({
        id: pond.pond_id,
        label: pond.name ?? `Kolam ${pond.pond_id}`,
        status: pond.status,
      })),
    [ponds],
  );

  const pondMap = useMemo(
    () =>
      new Map(
        ponds.map((pond) => [pond.pond_id, pond.name ?? `Kolam ${pond.pond_id}`]),
      ),
    [ponds],
  );

  const loadPonds = useCallback(async () => {
    try {
      const data = await api.getPonds();
      setPonds(data);
    } catch (error) {
      console.warn('Failed to load ponds', error);
    }
  }, []);

  const loadSchedules = useCallback(async () => {
    if (!selectedPondId) {
      setSchedules([]);
      return;
    }

    try {
      const data = await api.getFeederSchedules(selectedPondId);
      setSchedules(data);
    } catch (error) {
      console.warn('Failed to load feeder schedules', error);
    }
  }, [selectedPondId]);

  useEffect(() => {
    loadPonds();
  }, [loadPonds]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    if (!selectedPondId && pondOptions.length > 0) {
      setSelectedPondId(pondOptions[0].id);
    }
  }, [pondOptions, selectedPondId]);

  useEffect(() => {
    if (schedules.length === 0) {
      setIsFeederOn(false);
      return;
    }
    const anyActive = schedules.some((schedule) => schedule.is_active !== false);
    setIsFeederOn(anyActive);
  }, [schedules]);

  const sections = useMemo<ScheduleSection[]>(() => {
    const grouped: Record<SectionId, ScheduleItem[]> = {
      morning: [],
      noon: [],
      evening: [],
      night: [],
    };

    schedules.forEach((schedule) => {
      const date = schedule.time ? new Date(schedule.time) : null;
      const hour = date && !Number.isNaN(date.getTime()) ? date.getHours() : 0;
      const sectionId = getSectionId(hour);
      const pondLabel = pondMap.get(schedule.pond_id) ?? `Kolam ${schedule.pond_id}`;
      const amountLabel =
        schedule.dosage !== null && schedule.dosage !== undefined
          ? `${schedule.dosage.toFixed(1)} kg`
          : '--';

      grouped[sectionId].push({
        id: schedule.schedule_id,
        time: formatScheduleTime(schedule.time),
        pondLabel,
        amountLabel,
        isActive: schedule.is_active ?? true,
        isInactive: schedule.is_active === false,
      });
    });

    return (Object.keys(SECTION_META) as SectionId[]).map((sectionId) => ({
      ...SECTION_META[sectionId],
      items: grouped[sectionId].sort(
        (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time),
      ),
    }));
  }, [pondMap, schedules]);

  const parsedDosage = useMemo(() => parseDosage(dosageValue), [dosageValue]);

  const handleSaveSchedule = useCallback(async () => {
    if (!selectedPondId) {
      return;
    }

    if (parsedDosage === null) {
      alert('Masukkan dosis pakan terlebih dahulu.');
      return;
    }

    const scheduleTime = buildScheduleTimestamp(waktuValue);
    try {
      await api.createFeederSchedule({
        scheduleId: createLocalId(),
        pondId: selectedPondId,
        time: scheduleTime.toISOString(),
        dosage: parsedDosage,
      });
      await loadSchedules();
      setShowAddCard(false);
      setDosageValue('');
    } catch (error) {
      console.warn('Failed to save schedule', error);
      alert('Gagal menyimpan jadwal.');
    }
  }, [loadSchedules, parsedDosage, selectedPondId, waktuValue]);

  const handleToggleSchedule = useCallback(async (item: ScheduleItem) => {
    try {
      if (item.isActive) {
        await api.deactivateFeederSchedule(item.id);
      } else {
        await api.activateFeederSchedule(item.id);
      }
      setSchedules((prev) =>
        prev.map((schedule) =>
          schedule.schedule_id === item.id
            ? { ...schedule, is_active: !item.isActive }
            : schedule,
        ),
      );
    } catch (error) {
      console.warn('Failed to toggle schedule', error);
      alert('Gagal mengubah status jadwal.');
    }
  }, []);

  const handleToggleAllSchedules = useCallback(
    async (nextValue: boolean) => {
      if (isBulkUpdating) return;
      setIsBulkUpdating(true);
      setIsFeederOn(nextValue);

      const toUpdate = nextValue
        ? schedules.filter((schedule) => schedule.is_active === false)
        : schedules.filter((schedule) => schedule.is_active !== false);

      if (toUpdate.length === 0) {
        setIsBulkUpdating(false);
        return;
      }

      try {
        if (nextValue) {
          await Promise.all(
            toUpdate.map((schedule) => api.activateFeederSchedule(schedule.schedule_id)),
          );
        } else {
          await Promise.all(
            toUpdate.map((schedule) => api.deactivateFeederSchedule(schedule.schedule_id)),
          );
        }

        setSchedules((prev) =>
          prev.map((schedule) =>
            toUpdate.some((item) => item.schedule_id === schedule.schedule_id)
              ? { ...schedule, is_active: nextValue }
              : schedule,
          ),
        );
      } catch (error) {
        console.warn('Failed to update all schedules', error);
        alert('Gagal mengubah status semua jadwal.');
        setIsFeederOn(!nextValue);
      } finally {
        setIsBulkUpdating(false);
      }
    },
    [isBulkUpdating, schedules],
  );

  const deleteSchedule = useCallback(async (item: ScheduleItem) => {
    try {
      await api.deleteFeederSchedule(item.id);
      setSchedules((prev) =>
        prev.filter((schedule) => schedule.schedule_id !== item.id),
      );
    } catch (error) {
      console.warn('Failed to delete schedule', error);
      alert('Gagal menghapus jadwal.');
    }
  }, []);

  const handleDeleteSchedule = useCallback(
    (item: ScheduleItem) => {
      Alert.alert(
        'Hapus jadwal?',
        `Jadwal ${item.pondLabel} pukul ${item.time} akan dihapus.`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Hapus',
            style: 'destructive',
            onPress: () => {
              deleteSchedule(item);
            },
          },
        ],
      );
    },
    [deleteSchedule],
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadPonds(), loadSchedules()]);
  }, [loadPonds, loadSchedules]);

  return (
    <ThemedView style={styles.screen}>
      <PageHeader 
        title="Jadwal Pakan" 
        subtitle="Pengaturan jadwal pakan ikan" 
        onPressRightIcon={handleRefresh}
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
              onValueChange={handleToggleAllSchedules}
              disabled={isBulkUpdating || schedules.length === 0}
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
            ponds={pondOptions}
            selectedPondId={selectedPondId}
            waktuValue={waktuValue}
            dosageValue={dosageValue}
            isSaveDisabled={!selectedPondId || pondOptions.length === 0 || parsedDosage === null}
            onSelectPond={setSelectedPondId}
            onChangeWaktu={setWaktuValue}
            onChangeDosage={setDosageValue}
            onSave={handleSaveSchedule}
            onCancel={() => setShowAddCard(false)}
          />
        )}
        <ScheduleListCard
          sections={sections}
          onToggleItem={handleToggleSchedule}
          onDeleteItem={handleDeleteSchedule}
        />
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