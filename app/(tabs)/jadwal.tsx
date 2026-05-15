import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AddScheduleCard } from '@/components/ui/jadwal/add-schedule-card';
import { ScheduleListCard, type ScheduleItem, type ScheduleSection } from '@/components/ui/jadwal/schedule-list-card';
import { PageHeader } from '@/components/ui/page-header';
import { supabase } from '@/src/supabase';

type PondRow = {
  pond_id: string;
  name: string | null;
  status: string | null;
};

type ScheduleRow = {
  schedule_id: string;
  pond_id: string;
  time: string | null;
  dosage: number | null;
  is_active: boolean | null;
};

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

export default function JadwalScreen() {
  const [isFeederOn, setIsFeederOn] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [ponds, setPonds] = useState<PondRow[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [selectedPondId, setSelectedPondId] = useState<string | null>(null);
  const [waktuValue, setWaktuValue] = useState('07:00');

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
    const { data, error } = await supabase
      .from('ponds')
      .select('pond_id, name, status')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setPonds(data);
    }
  }, []);

  const loadSchedules = useCallback(async () => {
    const { data, error } = await supabase
      .from('feeding_schedules')
      .select('schedule_id, pond_id, time, dosage, is_active')
      .order('time', { ascending: true });

    if (!error && data) {
      setSchedules(data);
    }
  }, []);

  useEffect(() => {
    loadPonds();
    loadSchedules();
  }, [loadPonds, loadSchedules]);

  useEffect(() => {
    if (!selectedPondId && pondOptions.length > 0) {
      setSelectedPondId(pondOptions[0].id);
    }
  }, [pondOptions, selectedPondId]);

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

  const handleSaveSchedule = useCallback(async () => {
    if (!selectedPondId) {
      return;
    }

    const scheduleTime = buildScheduleTimestamp(waktuValue);
    const { error } = await supabase.from('feeding_schedules').insert({
      schedule_id: createLocalId(),
      pond_id: selectedPondId,
      time: scheduleTime.toISOString(),
      dosage: null,
      is_active: true,
    });

    if (!error) {
      await loadSchedules();
      setShowAddCard(false);
    } else {
      alert('Gagal menyimpan jadwal.');
    }
  }, [loadSchedules, selectedPondId, waktuValue]);

  const handleToggleSchedule = useCallback(
    async (item: ScheduleItem) => {
      const nextActive = !item.isActive;
      const { error } = await supabase
        .from('feeding_schedules')
        .update({ is_active: nextActive })
        .eq('schedule_id', item.id);

      if (!error) {
        setSchedules((prev) =>
          prev.map((schedule) =>
            schedule.schedule_id === item.id
              ? { ...schedule, is_active: nextActive }
              : schedule,
          ),
        );
      }
    },
    [],
  );

  const deleteSchedule = useCallback(async (item: ScheduleItem) => {
    const { error } = await supabase
      .from('feeding_schedules')
      .delete()
      .eq('schedule_id', item.id);

    if (!error) {
      setSchedules((prev) =>
        prev.filter((schedule) => schedule.schedule_id !== item.id),
      );
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
            ponds={pondOptions}
            selectedPondId={selectedPondId}
            waktuValue={waktuValue}
            isSaveDisabled={!selectedPondId || pondOptions.length === 0}
            onSelectPond={setSelectedPondId}
            onChangeWaktu={setWaktuValue}
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