import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { KolamSelector } from '@/components/ui/kolam-selector';
import { FilterStatusCard } from '@/components/ui/monitor/filter-status-card';
import { MonitorMetricCards, type Metric } from '@/components/ui/monitor/metric-cards';
import { PageHeader } from '@/components/ui/page-header';
import { api, type Pond, type Telemetry, type TelemetryFhi } from '@/src/api';
import { addNotification, type NotificationItem } from '@/src/notifications';

type PondRow = Pond;
type TelemetryRow = Telemetry;
type FhiResponse = TelemetryFhi | number | null;

type FilterHealthState = {
  percent: number;
  description: string;
  label?: string | null;
};

type StatusLevel = 'Baik' | 'Sedang' | 'Bahaya';

const TELEMETRY_LIMIT = 5;
const TELEMETRY_POLL_MS = 3000;
const PH_RANGE = { min: 6.5, max: 9.0 };
const TEMP_RANGE = { min: 24, max: 30 };
const TURB_RANGE = { min: 0, max: 25 };

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

  const phOk =
    telemetry.ph !== null && telemetry.ph >= PH_RANGE.min && telemetry.ph <= PH_RANGE.max;
  const tempOk =
    telemetry.temperature !== null &&
    telemetry.temperature >= TEMP_RANGE.min &&
    telemetry.temperature <= TEMP_RANGE.max;
  const turbOk =
    telemetry.turbidity !== null &&
    telemetry.turbidity >= TURB_RANGE.min &&
    telemetry.turbidity <= TURB_RANGE.max;

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

function buildDangerSummary(telemetry: TelemetryRow): string {
  const issues: string[] = [];

  if (telemetry.ph !== null && (telemetry.ph < PH_RANGE.min || telemetry.ph > PH_RANGE.max)) {
    issues.push(`pH ${formatNumber(telemetry.ph, 1)} (normal ${PH_RANGE.min}-${PH_RANGE.max})`);
  }

  if (
    telemetry.temperature !== null &&
    (telemetry.temperature < TEMP_RANGE.min || telemetry.temperature > TEMP_RANGE.max)
  ) {
    issues.push(
      `Suhu ${formatNumber(telemetry.temperature, 1)} C (normal ${TEMP_RANGE.min}-${TEMP_RANGE.max} C)`
    );
  }

  if (
    telemetry.turbidity !== null &&
    (telemetry.turbidity < TURB_RANGE.min || telemetry.turbidity > TURB_RANGE.max)
  ) {
    issues.push(
      `Kekeruhan ${formatNumber(telemetry.turbidity, 0)} NTU (normal ${TURB_RANGE.min}-${TURB_RANGE.max} NTU)`
    );
  }

  if (issues.length === 0) return 'Parameter berada di luar batas normal.';
  return `Parameter di luar batas: ${issues.join(', ')}.`;
}

function buildDangerNotification(
  telemetry: TelemetryRow,
  pondName: string | null,
  pondId: string,
): NotificationItem {
  const sourceLabel = pondName ?? `Kolam ${pondId}`;
  return {
    id: `telemetry-${telemetry.telemetry_id}`,
    title: 'Kondisi Bahaya Terdeteksi',
    description: `${sourceLabel}: ${buildDangerSummary(telemetry)}`,
    status: 'bahaya',
    sourceLabel,
    createdAt: telemetry.timestamp ?? new Date().toISOString(),
    iconName: 'warning',
    telemetryId: telemetry.telemetry_id,
    pondId,
  };
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function normalizeFhi(raw: FhiResponse | undefined): FilterHealthState | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number' && !Number.isNaN(raw)) {
    return {
      percent: clampPercent(raw),
      description: 'Indeks kesehatan filter terbaru.',
    };
  }

  if (typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;
  const payload =
    record.data && typeof record.data === 'object'
      ? (record.data as Record<string, unknown>)
      : record;
  const percent =
    parseNumber(payload.percent) ??
    parseNumber(payload.fhi) ??
    parseNumber(payload.value);

  if (percent === null) return null;

  const description =
    typeof payload.description === 'string' && payload.description.trim().length > 0
      ? payload.description
      : 'Indeks kesehatan filter terbaru.';
  const label =
    typeof payload.label === 'string' && payload.label.trim().length > 0
      ? payload.label
      : null;

  return {
    percent: clampPercent(percent),
    description,
    label,
  };
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

export default function MonitorScreen() {
  const [ponds, setPonds] = useState<PondRow[]>([]);
  const [selectedKolamId, setSelectedKolamId] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryRow[]>([]);
  const [filterHealth, setFilterHealth] = useState<FilterHealthState | null>(null);
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
      setFilterHealth(null);
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
          setFilterHealth(null);
          return;
        }
        const [telemetryResult, fhiResult] = await Promise.allSettled([
          api.getTelemetryByPond(selectedKolamId),
          api.getTelemetryFhi(selectedKolamId),
        ]);

        if (!isMounted) return;

        if (telemetryResult.status === 'fulfilled') {
          setTelemetry(sortTelemetry(telemetryResult.value));
        } else {
          console.warn('Telemetry polling failed', telemetryResult.reason);
          setTelemetry([]);
        }

        if (fhiResult.status === 'fulfilled') {
          setFilterHealth(normalizeFhi(fhiResult.value));
        } else {
          console.warn('FHI polling failed', fhiResult.reason);
          setFilterHealth(null);
        }
      } catch (error) {
        if (isMounted) {
          console.warn('Telemetry polling failed', error);
          setTelemetry([]);
          setFilterHealth(null);
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

  useEffect(() => {
    if (!selectedKolamId || telemetry.length === 0) return;
    const latest = telemetry[telemetry.length - 1];
    if (!latest) return;
    if (statusFromTelemetry(latest) !== 'Bahaya') return;

    const notification = buildDangerNotification(
      latest,
      selectedPond?.name ?? null,
      selectedKolamId,
    );
    void addNotification(notification);
  }, [telemetry, selectedKolamId, selectedPond?.name]);

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
  const hasFhi = !!filterHealth;
  const filterPercent = filterHealth?.percent ?? 0;
  const filterDescription =
    filterHealth?.description ?? 'Indeks kesehatan filter belum tersedia.';
  const metrics: Metric[] | undefined = useMemo(() => {
    if (!hasTelemetry) return undefined;

    const phStatus = metricStatus(latestTelemetry?.ph, PH_RANGE.min, PH_RANGE.max);
    const tempStatus = metricStatus(latestTelemetry?.temperature, TEMP_RANGE.min, TEMP_RANGE.max);
    const turbStatus = metricStatus(latestTelemetry?.turbidity, TURB_RANGE.min, TURB_RANGE.max);

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
        setFilterHealth(null);
        return;
      }

      setLoadingTelemetry(true);
      const [pondsResult, telemetryResult, fhiResult] = await Promise.allSettled([
        api.getPonds(),
        api.getTelemetryByPond(selectedKolamId),
        api.getTelemetryFhi(selectedKolamId),
      ]);

      if (pondsResult.status === 'fulfilled') {
        setPonds(pondsResult.value);
      } else {
        console.warn('Failed to refresh ponds', pondsResult.reason);
      }

      if (telemetryResult.status === 'fulfilled') {
        setTelemetry(sortTelemetry(telemetryResult.value));
      } else {
        console.warn('Failed to refresh telemetry', telemetryResult.reason);
      }

      if (fhiResult.status === 'fulfilled') {
        setFilterHealth(normalizeFhi(fhiResult.value));
      } else {
        console.warn('Failed to refresh FHI', fhiResult.reason);
      }
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
          percent={filterPercent}
          description={filterDescription}
          hasData={hasFhi}
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