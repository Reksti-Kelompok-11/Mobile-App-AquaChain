import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AutoFeederCard } from '@/components/ui/home/auto-feeder-card';
import { KolamOverviewCard } from '@/components/ui/home/kolam-overview-card';
import { KolamSelector } from '@/components/ui/kolam-selector';
import { PageHeader } from '@/components/ui/page-header';
import { api, type FeederSchedule, type Pond, type Telemetry } from '@/src/api';

type PondRow = Pond;
type TelemetryRow = Telemetry;
type FeedingScheduleRow = FeederSchedule;

type FeedingLogRow = {
  log_id: string;
  pond_id: string;
  scheduled_time: string | null;
  actual_time: string | null;
  target_dosage: number | null;
  actual_dosage: number | null;
  status: string | null;
};

type StatusLevel = 'Baik' | 'Sedang' | 'Bahaya';

const TELEMETRY_LIMIT = 5;
const TELEMETRY_POLL_MS = 5000;

const STATUS_THEME: Record<StatusLevel, { label: string; text: string; bg: string }> = {
  Baik: {
    label: 'Aman',
    text: '#128A3E',
    bg: '#DFF6E7',
  },
  Sedang: {
    label: 'Waspada',
    text: '#B35C00',
    bg: '#FFF1D6',
  },
  Bahaya: {
    label: 'Bahaya',
    text: '#B91C1C',
    bg: '#FFE1E1',
  },
};

function normalizeStatus(status?: string | null): StatusLevel {
  if (!status) return 'Sedang';
  const value = status.trim().toLowerCase();

  if (["baik", "aman", "normal", "ok"].includes(value)) return 'Baik';
  if (["bahaya", "buruk", "danger", "critical"].includes(value)) return 'Bahaya';
  if (["sedang", "waspada", "warning"].includes(value)) return 'Sedang';

  return 'Sedang';
}

function statusFromTelemetry(telemetry: TelemetryRow | null): StatusLevel {
  if (!telemetry) return 'Sedang';

  const phOk = telemetry.ph !== null && telemetry.ph >= 6.5 && telemetry.ph <= 9.0;
  const tempOk =
    telemetry.temperature !== null && telemetry.temperature >= 24 && telemetry.temperature <= 30;
  const turbOk = telemetry.turbidity !== null && telemetry.turbidity >= 0 && telemetry.turbidity <= 25;

  const outOfRange = [phOk, tempOk, turbOk].filter((ok) => !ok).length;

  if (outOfRange === 0) return 'Baik';
  if (outOfRange >= 2) return 'Bahaya';
  return 'Sedang';
}

function formatNumber(value: number | null | undefined, decimals: number) {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return value.toFixed(decimals);
}

function formatTimeValue(value: string | null) {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getMinutesOfDay(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getHours() * 60 + date.getMinutes();
}

function sortTelemetry(items: TelemetryRow[]) {
  const sorted = [...items].sort((a, b) => {
    const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return aTime - bTime;
  });

  return sorted.slice(-TELEMETRY_LIMIT);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function describeTrend(value: number) {
  const absValue = Math.abs(value);
  if (absValue < 0.1) return 'stabil';
  const direction = value > 0 ? 'naik' : 'turun';
  return `${direction} ${absValue.toFixed(1)} NTU`;
}

function computeFilterHealth(telemetryRows: TelemetryRow[]) {
  const turbidity = telemetryRows
    .map((item) => item.turbidity)
    .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));

  if (turbidity.length < 2) {
    return {
      percent: 70,
      description: 'Data belum cukup untuk menilai kesehatan filter.',
    };
  }

  const average = turbidity.reduce((sum, value) => sum + value, 0) / turbidity.length;
  const first = turbidity[0];
  const last = turbidity[turbidity.length - 1];
  const trend = last - first;
  const span = Math.max(...turbidity) - Math.min(...turbidity);

  let score = 100;
  const avgPenalty = Math.min(60, (average / 25) * 60);
  const trendPenalty = trend > 0 ? Math.min(25, trend * 2.5) : 0;
  const spanPenalty = span > 10 ? 10 : span > 5 ? 5 : 0;

  score = score - avgPenalty - trendPenalty - spanPenalty;
  score = Math.round(clampNumber(score, 0, 100));

  let description = `Rata-rata kekeruhan ${average.toFixed(1)} NTU, tren ${describeTrend(trend)}.`;
  if (score < 50) {
    description = `Filter bermasalah. Kekeruhan ${describeTrend(trend)}.`;
  } else if (score < 70) {
    description = `Filter mulai menurun. Kekeruhan ${describeTrend(trend)}.`;
  }

  return {
    percent: score,
    description,
  };
}

function filterStatusLabel(percent: number) {
  if (percent >= 80) return 'Baik';
  if (percent >= 60) return 'Sedang';
  return 'Buruk';
}

export default function HomeScreen() {
  const [now, setNow] = useState(new Date());
  const [ponds, setPonds] = useState<PondRow[]>([]);
  const [selectedPondId, setSelectedPondId] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryRow[]>([]);
  const [schedules, setSchedules] = useState<FeedingScheduleRow[]>([]);
  const [feedingLogs, setFeedingLogs] = useState<FeedingLogRow[]>([]);

  useEffect(() => {
    const timerId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

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
      console.warn('Failed to load schedules', error);
    }
  }, [selectedPondId]);

  const loadLogs = useCallback(async () => {
    if (!selectedPondId) {
      setFeedingLogs([]);
      return;
    }

    try {
      const data = await api.getFeederLogs(selectedPondId);
      setFeedingLogs(data as FeedingLogRow[]);
    } catch (error) {
      console.warn('Failed to load feeder logs', error);
    }
  }, [selectedPondId]);

  useEffect(() => {
    loadPonds();
  }, [loadPonds]);

  useEffect(() => {
    if (!selectedPondId && ponds.length > 0) {
      setSelectedPondId(ponds[0].pond_id);
    }
  }, [ponds, selectedPondId]);

  useEffect(() => {
    if (!selectedPondId) {
      setTelemetry([]);
      setSchedules([]);
      setFeedingLogs([]);
      return;
    }

    let isMounted = true;
    let pollTimeout: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;

    const loadTelemetry = async () => {
      if (!isMounted || inFlight) return;
      inFlight = true;
      try {
        const data = await api.getTelemetryByPond(selectedPondId);
        if (!isMounted) return;
        setTelemetry(sortTelemetry(data));
      } catch (error) {
        if (isMounted) {
          console.warn('Home telemetry polling failed', error);
          setTelemetry([]);
        }
      } finally {
        inFlight = false;
      }
    };

    const poll = async () => {
      await loadTelemetry();
      if (!isMounted) return;
      pollTimeout = setTimeout(poll, TELEMETRY_POLL_MS);
    };

    poll();
    loadSchedules();
    loadLogs();

    return () => {
      isMounted = false;
      if (pollTimeout) {
        clearTimeout(pollTimeout);
      }
    };
  }, [loadLogs, loadSchedules, ponds.length, selectedPondId]);

  const timeLabel = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const selectedPond = useMemo(
    () => ponds.find((pond) => pond.pond_id === selectedPondId) ?? null,
    [ponds, selectedPondId],
  );

  const kolamItems = useMemo(
    () =>
      ponds.map((pond) => ({
        id: pond.pond_id,
        name: pond.name ?? `Kolam ${pond.pond_id}`,
        status: pond.status,
      })),
    [ponds],
  );

  const attentionCount = useMemo(
    () => ponds.filter((pond) => normalizeStatus(pond.status) !== 'Baik').length,
    [ponds],
  );

  const latestTelemetry = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;
  const telemetryStatus = statusFromTelemetry(latestTelemetry);
  const pondStatus = selectedPond?.status ? normalizeStatus(selectedPond.status) : telemetryStatus;
  const statusTheme = STATUS_THEME[pondStatus];
  const filterHealth = useMemo(() => computeFilterHealth(telemetry), [telemetry]);
  const filterLabel = filterStatusLabel(filterHealth.percent);

  const overviewMetrics = useMemo(
    () => [
      {
        id: 'ph',
        label: 'pH',
        value: formatNumber(latestTelemetry?.ph, 1),
        unit: '',
        iconName: 'opacity' as const,
        iconColor: '#2F7BFF',
        iconBg: '#DCE9FF',
        valueColor: '#2F7BFF',
      },
      {
        id: 'temp',
        label: 'Suhu',
        value: formatNumber(latestTelemetry?.temperature, 1),
        unit: 'C',
        iconName: 'device-thermostat' as const,
        iconColor: '#1E5BFF',
        iconBg: '#DCE9FF',
        valueColor: '#1E5BFF',
      },
      {
        id: 'turbidity',
        label: 'Kekeruhan',
        value: formatNumber(latestTelemetry?.turbidity, 1),
        unit: 'NTU',
        iconName: 'visibility' as const,
        iconColor: '#14A44D',
        iconBg: '#DFF6E7',
        valueColor: '#14A44D',
      },
    ],
    [latestTelemetry],
  );

  const latestLogTime = useMemo(() => {
    const times = feedingLogs
      .map((log) => log.actual_time ?? log.scheduled_time)
      .filter((value): value is string => !!value);

    if (times.length === 0) return null;
    return times
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
  }, [feedingLogs]);

  const feederTimes = useMemo(() => {
    const sorted = [...schedules].sort((a, b) => {
      const aTime = a.time ? new Date(a.time).getTime() : 0;
      const bTime = b.time ? new Date(b.time).getTime() : 0;
      return aTime - bTime;
    });

    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    return sorted.map((schedule) => {
      const scheduleMinutes = getMinutesOfDay(schedule.time);
      const isInactive = schedule.is_active === false;
      const isDone = !isInactive && scheduleMinutes !== null && scheduleMinutes <= nowMinutes;

      return {
        id: schedule.schedule_id,
        time: formatTimeValue(schedule.time),
        statusLabel: isInactive ? 'Nonaktif' : 'Terjadwal',
        isActive: isDone,
      };
    });
  }, [now, schedules]);

  const feederActive = useMemo(
    () => schedules.some((schedule) => schedule.is_active !== false),
    [schedules],
  );

  const feederSubtitle = latestLogTime
    ? `Pakan terakhir: ${formatTimeValue(latestLogTime.toISOString())}`
    : 'Pakan terakhir: -';

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadPonds(), loadSchedules(), loadLogs()]);

    if (!selectedPondId) {
      setTelemetry([]);
      return;
    }

    try {
      const data = await api.getTelemetryByPond(selectedPondId);
      setTelemetry(sortTelemetry(data));
    } catch (error) {
      console.warn('Failed to refresh telemetry', error);
    }
  }, [loadLogs, loadPonds, loadSchedules, selectedPondId]);

  return (
    <ThemedView style={styles.screen}>
      <PageHeader 
        title="Selamat Pagi, Wijak" 
        subtitle={`Waktu Real Time : ${timeLabel} WIB`}
        onPressRightIcon={handleRefresh}
      >
        <View style={styles.alertPill}>
          <View style={styles.alertIcon}>
            <MaterialIcons name="warning" size={18} color="#1F1F1F" />
          </View>
          <ThemedText style={styles.alertText}>
            {attentionCount > 0
              ? `${attentionCount} Kolam Perlu Diperhatikan`
              : 'Semua kolam dalam kondisi baik'}
          </ThemedText>
        </View>
      </PageHeader>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <KolamSelector
          items={kolamItems}
          selectedId={selectedPondId ?? undefined}
          onSelect={setSelectedPondId}
        />
        <KolamOverviewCard
          title={selectedPond?.name ?? 'Kolam'}
          subtitle={
            selectedPond
              ? `${selectedPond.fish_type ?? 'Ikan'}${selectedPond.capacity ? ` - ${selectedPond.capacity.toLocaleString('id-ID')} ekor` : ''}`
              : 'Belum ada data kolam'
          }
          statusLabel={statusTheme.label}
          statusBg={statusTheme.bg}
          statusTextColor={statusTheme.text}
          metrics={overviewMetrics}
          filterLabel="Kondisi Filter"
          filterPercent={filterHealth.percent}
          filterStatusLabel={filterLabel}
        />
        <AutoFeederCard
          subtitle={feederSubtitle}
          statusLabel={feederActive ? 'Aktif' : 'Nonaktif'}
          statusColor={feederActive ? '#19B356' : '#9CA3AF'}
          statusDotColor={feederActive ? '#35D07A' : '#C0C5CE'}
          times={feederTimes}
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
    paddingBottom: 24,
  },
  alertPill: {
    marginTop: 14,
    backgroundColor: '#F6FF8B',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFE256',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: {
    color: '#1F1F1F',
    fontSize: 13,
    fontWeight: '600',
  },
});
