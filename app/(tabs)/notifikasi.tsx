import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { NotificationCard } from '@/components/ui/notifikasi/notification-card';
import { PageHeader } from '@/components/ui/page-header';
import { clearNotifications, loadNotifications, type NotificationItem } from '@/src/notifications';

function formatRelativeTime(timestamp?: string | null): string | undefined {
  if (!timestamp) return undefined;
  const time = new Date(timestamp).getTime();
  if (Number.isNaN(time)) return undefined;
  const diffMs = Date.now() - time;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes === 0) return 'baru saja';
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

export default function NotifikasiScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await loadNotifications();
      setNotifications(data);
    } catch (error) {
      console.warn('Gagal memuat notifikasi lokal', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshNotifications();
    }, [refreshNotifications]),
  );

  const handleMarkAllRead = useCallback(async () => {
    await clearNotifications();
    setNotifications([]);
    alert('Semua notifikasi ditandai sudah dibaca.');
  }, []);

  const handleRefresh = useCallback(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  const bahayaCount = useMemo(
    () => notifications.filter((item) => item.status === 'bahaya').length,
    [notifications],
  );
  const hasBahaya = bahayaCount > 0;

  return (
    <ThemedView style={styles.screen}>
      <PageHeader
        title="Notifikasi"
        subtitle="Peringatan dan Info Sistem"
        rightActionLabel="Baca Semua"
        onPressRightAction={handleMarkAllRead}
        onPressRightIcon={handleRefresh}
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
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            title={notification.title}
            description={notification.description}
            status={notification.status}
            sourceLabel={notification.sourceLabel}
            timeLabel={formatRelativeTime(notification.createdAt)}
            actionLabel={notification.actionLabel}
            iconName={notification.iconName}
          />
        ))}
        {isLoading ? (
          <View style={styles.helperTextWrap}>
            <ThemedText style={styles.helperText}>Memuat notifikasi...</ThemedText>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.helperTextWrap}>
            <ThemedText style={styles.helperText}>Belum ada notifikasi bahaya.</ThemedText>
          </View>
        ) : null}
        <View style={styles.helperTextWrap}>
          <ThemedText style={styles.helperText}>
            Notifikasi bahaya tersimpan di perangkat dan muncul otomatis saat kondisi berbahaya terdeteksi.
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
    color: '#ffffff',
  },
});