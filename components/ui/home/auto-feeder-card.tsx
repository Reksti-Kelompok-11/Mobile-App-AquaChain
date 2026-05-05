import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type FeederTime = {
  id: string;
  time: string;
  statusLabel: string;
  isActive?: boolean;
};

type AutoFeederCardProps = {
  title?: string;
  subtitle?: string;
  statusLabel?: string;
  statusColor?: string;
  statusDotColor?: string;
  times?: FeederTime[];
};

const defaultTimes: FeederTime[] = [
  { id: '1', time: '06:00', statusLabel: 'Selesai', isActive: true },
  { id: '2', time: '12:00', statusLabel: 'Terjadwal' },
  { id: '3', time: '18:00', statusLabel: 'Terjadwal' },
];

export function AutoFeederCard({
  title = 'Auto-Feeder',
  subtitle = 'Pakan terakhir: 06:00',
  statusLabel = 'Aktif',
  statusColor = '#19B356',
  statusDotColor = '#35D07A',
  times = defaultTimes,
}: AutoFeederCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="flash-on" size={18} color="#2F7BFF" />
          </View>
          <View>
            <ThemedText style={styles.title}>{title}</ThemedText>
            <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
          </View>
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
          <ThemedText style={[styles.statusText, { color: statusColor }]}
          >
            {statusLabel}
          </ThemedText>
        </View>
      </View>

      <View style={styles.timesRow}>
        {times.map((item) => (
          <View
            key={item.id}
            style={[styles.timeCard, item.isActive && styles.timeCardActive]}
          >
            <ThemedText
              style={[styles.timeValue, item.isActive && styles.timeValueActive]}
            >
              {item.time}
            </ThemedText>
            <ThemedText
              style={[
                styles.timeStatus,
                item.isActive && styles.timeStatusActive,
              ]}
            >
              {item.isActive ? 'Selesai' : item.statusLabel}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCE9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E2B3A',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timesRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  timeCard: {
    flex: 1,
    backgroundColor: '#F3F6FF',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  timeCardActive: {
    backgroundColor: '#DCE9FF',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2F7BFF',
  },
  timeValueActive: {
    color: '#1E5BFF',
  },
  timeStatus: {
    fontSize: 11,
    color: '#8A8F98',
    marginTop: 2,
  },
  timeStatusActive: {
    color: '#2F7BFF',
  },
});
