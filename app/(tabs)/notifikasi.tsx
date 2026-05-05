import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { NotificationCard } from '@/components/ui/notifikasi/notification-card';
import { PageHeader } from '@/components/ui/page-header';

export default function NotifikasiScreen() {
  const notifications: Array<{
    title: string;
    description: string;
    status: 'bahaya' | 'waspada' | 'info' | 'selesai';
    sourceLabel?: string;
    timeLabel?: string;
    actionLabel?: string;
    iconName?: 'device-thermostat' | 'restaurant' | 'warning' | 'info' | 'check-circle';
    onPressAction?: () => void;
  }> = [
    {
      title: 'Suhu Air Tinggi',
      description:
        'Suhu Kolam A2 mencapai 30.2C. Pertimbangkan untuk menambah aerasi.',
      status: 'waspada',
      sourceLabel: 'Kolam A2',
      timeLabel: '12 menit lalu',
      actionLabel: 'Tindakan',
      iconName: 'device-thermostat',
      onPressAction: () => alert('Tindakan: suhu air'),
    },
    {
      title: 'Pakan Otomatis Diberikan',
      description:
        'Sesi pakan pagi (06:00) selesai. Total 8.5 kg untuk 3 kolam.',
      status: 'info',
      sourceLabel: 'Semua Kolam',
      timeLabel: '2 jam lalu',
      iconName: 'restaurant',
    },
    {
      title: 'Amonia Tinggi — Terdeteksi',
      description:
        'Kadar amonia Kolam A2 mencapai 1.2 mg/L. Sistem menghentikan pakan otomatis!',
      status: 'bahaya',
      sourceLabel: 'Kolam A2',
      timeLabel: 'Kemarin 18:30',
      actionLabel: 'Tindakan',
      iconName: 'warning',
      onPressAction: () => alert('Tindakan: amonia'),
    },
    {
      title: 'Data Tersinkron ke Blockchain',
      description:
        'Log operasional harian berhasil di-anchor ke blockchain. Data tidak dapat diubah.',
      status: 'info',
      sourceLabel: 'Sistem',
      timeLabel: 'Kemarin 00:00',
      iconName: 'info',
    },
    {
      title: 'Filter Kolam Diganti',
      description: 'Penggantian filter Kolam B1 selesai. Sistem kembali normal.',
      status: 'selesai',
      sourceLabel: 'Kolam B1',
      timeLabel: '2 hari lalu',
      iconName: 'check-circle',
    },
  ];

  const bahayaCount = notifications.filter(
    (item) => item.status === 'bahaya'
  ).length;
  const hasBahaya = bahayaCount > 0;

  return (
    <ThemedView style={styles.screen}>
      <PageHeader
        title="Notifikasi"
        subtitle="Peringatan dan Info Sistem"
        rightActionLabel="Baca Semua"
        onPressRightAction={() => alert('Semua notifikasi ditandai sudah dibaca.')}
        onPressRightIcon={() => alert('Menyegarkan notifikasi...')}
      >
        <View style={[styles.warningPill, !hasBahaya && styles.safePill]}>
          <View style={[styles.warningDot, !hasBahaya && styles.safeDot]} />
          <ThemedText style={[styles.warningText, !hasBahaya && styles.safeText]}>
            {hasBahaya
              ? `${bahayaCount} pesan bahaya terdeteksi.`
              : 'Tidak ada pesan bahaya.'}
          </ThemedText>
        </View>
      </PageHeader>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {notifications.map((notification, index) => (
          <NotificationCard
            key={`${notification.title}-${index}`}
            title={notification.title}
            description={notification.description}
            status={notification.status}
            sourceLabel={notification.sourceLabel}
            timeLabel={notification.timeLabel}
            actionLabel={notification.actionLabel}
            iconName={notification.iconName}
            onPressAction={notification.onPressAction}
          />
        ))}
        <View style={styles.helperTextWrap}>
          <ThemedText style={styles.helperText}>
            Notifikasi baru akan muncul otomatis dari sistem monitoring.
          </ThemedText>
        </View>
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
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  helperTextWrap: {
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#8A8F98',
  },
  warningPill: {
    marginTop: 12,
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: 'rgba(230, 70, 70, 0.50)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  warningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E64646',
  },
  warningText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFACAC',
  },
  safePill: {
    backgroundColor: 'rgba(43, 190, 93, 0.2)',
  },
  safeDot: {
    backgroundColor: '#2BBE5D',
  },
  safeText: {
    color: '#1D7A3B',
  },
});