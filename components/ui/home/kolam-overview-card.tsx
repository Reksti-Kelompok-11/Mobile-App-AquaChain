import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type MetricItem = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  valueColor: string;
};

type KolamOverviewCardProps = {
  title?: string;
  subtitle?: string;
  statusLabel?: string;
  statusBg?: string;
  statusTextColor?: string;
  metrics?: MetricItem[];
  filterLabel?: string;
  filterPercent?: number;
  filterStatusLabel?: string;
};

const defaultMetrics: MetricItem[] = [
  {
    id: 'ph',
    label: 'pH',
    value: '7.2',
    unit: '',
    iconName: 'opacity',
    iconColor: '#2F7BFF',
    iconBg: '#DCE9FF',
    valueColor: '#2F7BFF',
  },
  {
    id: 'temp',
    label: 'Suhu',
    value: '28.5',
    unit: 'C',
    iconName: 'device-thermostat',
    iconColor: '#1E5BFF',
    iconBg: '#DCE9FF',
    valueColor: '#1E5BFF',
  },
  {
    id: 'turbidity',
    label: 'Kekeruhan',
    value: '12',
    unit: 'NTU',
    iconName: 'visibility',
    iconColor: '#14A44D',
    iconBg: '#DFF6E7',
    valueColor: '#14A44D',
  },
];

export function KolamOverviewCard({
  title = 'Kolam A1',
  subtitle = 'Ikan Lele - 2.800 ekor',
  statusLabel = 'Aman',
  statusBg = '#DFF6E7',
  statusTextColor = '#128A3E',
  metrics = defaultMetrics,
  filterLabel = 'Kondisi Filter',
  filterPercent = 82,
  filterStatusLabel = 'Baik',
}: KolamOverviewCardProps) {
  const clamped = Math.max(0, Math.min(filterPercent, 100));

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusBg }]}
        >
          <MaterialIcons name="check" size={14} color={statusTextColor} />
          <ThemedText style={[styles.statusText, { color: statusTextColor }]}
          >
            {statusLabel}
          </ThemedText>
        </View>
      </View>

      <View style={styles.metricsRow}>
        {metrics.map((metric) => (
          <View key={metric.id} style={styles.metricCard}>
            <View
              style={[styles.metricIcon, { backgroundColor: metric.iconBg }]}
            >
              <MaterialIcons
                name={metric.iconName}
                size={20}
                color={metric.iconColor}
              />
            </View>
            <View style={styles.metricValueWrap}>
              <ThemedText
                style={[styles.metricValue, { color: metric.valueColor }]}
              >
                {metric.value}
              </ThemedText>
              {!!metric.unit && (
                <ThemedText
                  style={[styles.metricUnit, { color: metric.valueColor }]}
                >
                  {metric.unit}
                </ThemedText>
              )}
            </View>
            <ThemedText style={styles.metricLabel}>{metric.label}</ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.filterRow}>
        <ThemedText style={styles.filterLabel}>{filterLabel}</ThemedText>
        <ThemedText style={styles.filterStatus}>
          {filterStatusLabel} ({clamped}%)
        </ThemedText>
      </View>
      <View style={styles.filterTrack}>
        <View style={[styles.filterFill, { width: `${clamped}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EAF2FF',
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E2B3A',
  },
  subtitle: {
    fontSize: 12,
    color: '#4B6B9A',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValueWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginTop: 6,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  metricUnit: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B6B9A',
  },
  filterStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: '#128A3E',
  },
  filterTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#DCE7F7',
    overflow: 'hidden',
    marginTop: 8,
  },
  filterFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#1EAD4A',
  },
});
