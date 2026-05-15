import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { KolamSelector } from '@/components/ui/kolam-selector';
import { FilterStatusCard } from '@/components/ui/monitor/filter-status-card';
import { MonitorMetricCards, type Metric } from '@/components/ui/monitor/metric-cards';
import { PageHeader } from '@/components/ui/page-header';
import { api, type Pond, type Telemetry } from '@/src/api';

type PondRow = Pond;
type TelemetryRow = Telemetry;

type StatusLevel = 'Baik' | 'Sedang' | 'Bahaya';

const TELEMETRY_LIMIT = 5;
const TELEMETRY_POLL_MS = 3000;

const STATUS_UI: Record<StatusLevel, { label: string; text: string; bg: string; iconBg: string }> = {
  Baik: {
    label: 'Kondisi Aman',
    text: '#1D7A3B',
    bg: '#BFFFA4',
    iconBg: '#2BBE5D',
  },
  Sedang: {
    label: 'Perlu Perhatian',
    text: '#8A5A00',
    bg: '#FFE3A1',
    iconBg: '#F5B83C',
  },
  Bahaya: {
    label: 'Kondisi Bahaya',
    text: '#7A1D1D',
    bg: '#FFC6C6',
    iconBg: '#E24B4B',
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

function formatRelativeTime(timestamp?: string | null): string | null {
  if (!timestamp) return null;
  const time = new Date(timestamp).getTime();
  if (Number.isNaN(time)) return null;
  const diffMs = Date.now() - time;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes === 0) return 'baru saja';
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

function formatNumber(value: number | null | undefined, decimals: number): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return value.toFixed(decimals);
}

function buildSeries<T>(items: T[], accessor: (item: T) => number | null): number[] {
  const values = items
    .map(accessor)
    .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));

  return values.length > 0 ? values : [0];
}

function sortTelemetry(items: TelemetryRow[]): TelemetryRow[] {
  const sorted = [...items].sort((a, b) => {
    const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return aTime - bTime;
  });

  return sorted.slice(-TELEMETRY_LIMIT);
}

function metricStatus(value: number | null | undefined, min: number, max: number) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return {
      label: 'Belum ada',
      color: '#6B7280',
      bg: 'rgba(107, 114, 128, 0.14)',
    };
  }

  if (value < min || value > max) {
    return {
      label: 'Waspada',
      color: '#B35C00',
      bg: 'rgba(255, 170, 51, 0.2)',
    };
  }

  return {
    label: 'Aman',
    color: '#1E7A3E',
    bg: 'rgba(46, 184, 92, 0.16)',
  };
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

export default function MonitorScreen() {
  const [ponds, setPonds] = useState<PondRow[]>([]);
  const [selectedKolamId, setSelectedKolamId] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryRow[]>([]);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPonds() {
      try {
        const data = await api.getPonds();
        if (!isMounted) return;
        setPonds(data);
      } catch (error) {
        if (isMounted) {
          console.warn('Failed to load ponds', error);
        }
      }
    }

    loadPonds();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedKolamId && ponds.length > 0) {
      setSelectedKolamId(ponds[0].pond_id);
    }
  }, [ponds, selectedKolamId]);

  useEffect(() => {
    if (!selectedKolamId) {
      setTelemetry([]);
      return;
    }

    let isMounted = true;
    let pollTimeout: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;

    async function loadTelemetry() {
      if (!isMounted || inFlight) return;
      inFlight = true;
      setLoadingTelemetry(true);
      try {
        if (!selectedKolamId) {
          setTelemetry([]);
          return;
        }
        const data = await api.getTelemetryByPond(selectedKolamId);
        if (!isMounted) return;
        setTelemetry(sortTelemetry(data));
      } catch (error) {
        if (isMounted) {
          console.warn('Telemetry polling failed', error);
          setTelemetry([]);
        }
      } finally {
        if (isMounted) {
          setLoadingTelemetry(false);
        }
        inFlight = false;
      }
    }

    const poll = async () => {
      await loadTelemetry();
      if (!isMounted) return;
      pollTimeout = setTimeout(poll, TELEMETRY_POLL_MS);
    };

    poll();

    return () => {
      isMounted = false;
      if (pollTimeout) {
        clearTimeout(pollTimeout);
      }
    };
  }, [selectedKolamId]);

  const selectedPond = useMemo(
    () => ponds.find((pond) => pond.pond_id === selectedKolamId) ?? null,
    [ponds, selectedKolamId],
  );

  const latestTelemetry = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;
  const telemetryStatus = statusFromTelemetry(latestTelemetry);
  const pondStatus = selectedPond?.status ? normalizeStatus(selectedPond.status) : telemetryStatus;
  const statusUi = STATUS_UI[pondStatus];

  const updatedLabel = formatRelativeTime(latestTelemetry?.timestamp);
  const statusSubtitle = selectedPond?.name
    ? `${selectedPond.name} - ${updatedLabel ? `Diperbarui ${updatedLabel}` : 'Belum ada data'}`
    : updatedLabel
      ? `Diperbarui ${updatedLabel}`
      : 'Belum ada data';

  const kolamItems = useMemo(
    () =>
      ponds.map((pond) => ({
        id: pond.pond_id,
        name: pond.name ?? `Kolam ${pond.pond_id}`,
        status: pond.status,
      })),
    [ponds],
  );

  const hasTelemetry = telemetry.length > 0;
  const filterHealth = useMemo(() => computeFilterHealth(telemetry), [telemetry]);
  const metrics: Metric[] | undefined = useMemo(() => {
    if (!hasTelemetry) return undefined;

    const phStatus = metricStatus(latestTelemetry?.ph, 6.5, 9.0);
    const tempStatus = metricStatus(latestTelemetry?.temperature, 24, 30);
    const turbStatus = metricStatus(latestTelemetry?.turbidity, 0, 25);

    return [
      {
        id: 'ph',
        title: 'Tingkat pH Air',
        subtitle: 'Normal: 6.5 - 9.0',
        value: formatNumber(latestTelemetry?.ph, 1),
        unit: 'pH',
        chartData: buildSeries(telemetry, (item) => item.ph),
        statusLabel: phStatus.label,
        statusColor: phStatus.color,
        statusBg: phStatus.bg,
        iconName: 'opacity',
        iconColor: '#2F7BFF',
        iconBg: 'rgba(47, 123, 255, 0.12)',
        valueColor: '#2F7BFF',
        chartColor: '#2F7BFF',
        chartFill: 'rgba(47, 123, 255, 0.12)',
      },
      {
        id: 'temp',
        title: 'Suhu Air',
        subtitle: 'Normal: 24 - 30 C',
        value: formatNumber(latestTelemetry?.temperature, 1),
        unit: 'C',
        chartData: buildSeries(telemetry, (item) => item.temperature),
        statusLabel: tempStatus.label,
        statusColor: tempStatus.color,
        statusBg: tempStatus.bg,
        iconName: 'device-thermostat',
        iconColor: '#E53935',
        iconBg: 'rgba(229, 57, 53, 0.12)',
        valueColor: '#E53935',
        chartColor: '#E53935',
        chartFill: 'rgba(229, 57, 53, 0.12)',
      },
      {
        id: 'turbidity',
        title: 'Kekeruhan Air',
        subtitle: 'Normal: 0 - 25 NTU',
        value: formatNumber(latestTelemetry?.turbidity, 0),
        unit: 'NTU',
        chartData: buildSeries(telemetry, (item) => item.turbidity),
        statusLabel: turbStatus.label,
        statusColor: turbStatus.color,
        statusBg: turbStatus.bg,
        iconName: 'visibility',
        iconColor: '#FB8C00',
        iconBg: 'rgba(251, 140, 0, 0.12)',
        valueColor: '#FB8C00',
        chartColor: '#FB8C00',
        chartFill: 'rgba(251, 140, 0, 0.12)',
      },
    ];
  }, [hasTelemetry, latestTelemetry, telemetry]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      if (!selectedKolamId) {
        const data = await api.getPonds();
        setPonds(data);
        setTelemetry([]);
        return;
      }

      setLoadingTelemetry(true);
      const [pondsResult, telemetryResult] = await Promise.all([
        api.getPonds(),
        api.getTelemetryByPond(selectedKolamId),
      ]);

      setPonds(pondsResult);
      setTelemetry(sortTelemetry(telemetryResult));
    } catch (error) {
      console.warn('Failed to refresh monitor data', error);
    } finally {
      setLoadingTelemetry(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing, selectedKolamId]);

  return (
    <ThemedView style={styles.screen}>
      <PageHeader 
        title="Monitor Air" 
        subtitle="Pemantauan Kualitas Air Real Time"
        onPressRightIcon={handleRefresh}
      >
        <View style={[styles.statusCard, { backgroundColor: statusUi.bg }]}>
          <View style={[styles.statusIcon, { backgroundColor: statusUi.iconBg }]}>
            <MaterialIcons name="check" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.statusTextWrap}>
            <ThemedText style={[styles.statusTitle, { color: statusUi.text }]}>
              {statusUi.label}
            </ThemedText>
            <ThemedText style={styles.statusSubtitle}>{statusSubtitle}</ThemedText>
          </View>
        </View>
      </PageHeader>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <KolamSelector
          items={kolamItems}
          selectedId={selectedKolamId ?? undefined}
          onSelect={setSelectedKolamId}
        />
        <MonitorMetricCards items={metrics} hasData={hasTelemetry} />
        <FilterStatusCard
          title="Indeks Kesehatan Filter"
          percent={filterHealth.percent}
          description={filterHealth.description}
          hasData={hasTelemetry}
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