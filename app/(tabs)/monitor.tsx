import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type {
  RealtimePostgresDeletePayload,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { KolamSelector } from '@/components/ui/kolam-selector';
import { FilterStatusCard } from '@/components/ui/monitor/filter-status-card';
import { MonitorMetricCards, type Metric } from '@/components/ui/monitor/metric-cards';
import { PageHeader } from '@/components/ui/page-header';
import { supabase } from '@/src/supabase';

type PondRow = {
  pond_id: string;
  name: string | null;
  fish_type: string | null;
  capacity: number | null;
  status: string | null;
  created_at: string | null;
};

type TelemetryRow = {
  telemetry_id: string;
  pond_id: string;
  ph: number | null;
  temperature: number | null;
  turbidity: number | null;
  timestamp: string | null;
};

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

export default function MonitorScreen() {
  const [ponds, setPonds] = useState<PondRow[]>([]);
  const [selectedKolamId, setSelectedKolamId] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryRow[]>([]);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPonds() {
      const { data, error } = await supabase
        .from('ponds')
        .select('pond_id, name, fish_type, capacity, status, created_at')
        .order('created_at', { ascending: true });

      if (!isMounted) return;
      if (!error && data) {
        setPonds(data);
      }
    }

    loadPonds();

    const channel = supabase
      .channel('ponds-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ponds' },
        (payload: RealtimePostgresInsertPayload<PondRow>) => {
          const next = payload.new as PondRow;
          setPonds((current) => {
            const exists = current.some((pond) => pond.pond_id === next.pond_id);
            return exists ? current : [...current, next];
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ponds' },
        (payload: RealtimePostgresUpdatePayload<PondRow>) => {
          const next = payload.new as PondRow;
          setPonds((current) =>
            current.map((pond) => (pond.pond_id === next.pond_id ? next : pond)),
          );
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'ponds' },
        (payload: RealtimePostgresDeletePayload<PondRow>) => {
          const removed = payload.old as PondRow;
          setPonds((current) =>
            current.filter((pond) => pond.pond_id !== removed.pond_id),
          );
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
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
        const { data, error } = await supabase
          .from('telemetry')
          .select('telemetry_id, pond_id, ph, temperature, turbidity, timestamp')
          .eq('pond_id', selectedKolamId)
          .order('timestamp', { ascending: false })
          .limit(TELEMETRY_LIMIT);

        if (!isMounted) return;
        if (!error && data) {
          setTelemetry(sortTelemetry(data));
        } else {
          setTelemetry([]);
        }
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

    const channel = supabase
      .channel(`telemetry:${selectedKolamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetry',
          filter: `pond_id=eq.${selectedKolamId}`,
        },
        (payload: RealtimePostgresInsertPayload<TelemetryRow>) => {
          const next = payload.new as TelemetryRow;
          setTelemetry((current) => {
            const filtered = current.filter((item) => item.telemetry_id !== next.telemetry_id);
            return sortTelemetry([...filtered, next]);
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'telemetry',
          filter: `pond_id=eq.${selectedKolamId}`,
        },
        (payload: RealtimePostgresUpdatePayload<TelemetryRow>) => {
          const next = payload.new as TelemetryRow;
          setTelemetry((current) => {
            const filtered = current.filter((item) => item.telemetry_id !== next.telemetry_id);
            return sortTelemetry([...filtered, next]);
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'telemetry',
          filter: `pond_id=eq.${selectedKolamId}`,
        },
        (payload: RealtimePostgresDeletePayload<TelemetryRow>) => {
          const removed = payload.old as TelemetryRow;
          setTelemetry((current) =>
            sortTelemetry(current.filter((item) => item.telemetry_id !== removed.telemetry_id)),
          );
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (pollTimeout) {
        clearTimeout(pollTimeout);
      }
      supabase.removeChannel(channel);
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
      const pondsRequest = supabase
        .from('ponds')
        .select('pond_id, name, fish_type, capacity, status, created_at')
        .order('created_at', { ascending: true });

      if (!selectedKolamId) {
        const { data, error } = await pondsRequest;
        if (!error && data) {
          setPonds(data);
        }
        setTelemetry([]);
        return;
      }

      setLoadingTelemetry(true);
      const [pondsResult, telemetryResult] = await Promise.all([
        pondsRequest,
        supabase
          .from('telemetry')
          .select('telemetry_id, pond_id, ph, temperature, turbidity, timestamp')
          .eq('pond_id', selectedKolamId)
          .order('timestamp', { ascending: false })
          .limit(TELEMETRY_LIMIT),
      ]);

      if (!pondsResult.error && pondsResult.data) {
        setPonds(pondsResult.data);
      }

      if (!telemetryResult.error && telemetryResult.data) {
        setTelemetry(sortTelemetry(telemetryResult.data));
      } else {
        setTelemetry([]);
      }
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
        <FilterStatusCard hasData={hasTelemetry} />
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