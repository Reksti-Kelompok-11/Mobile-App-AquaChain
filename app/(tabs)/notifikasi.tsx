import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { NotificationCard } from '@/components/ui/notifikasi/notification-card';
import { PageHeader } from '@/components/ui/page-header';

export default function NotifikasiScreen() {
  return (
    <ThemedView style={styles.screen}>
      <PageHeader
        title="Notifikasi"
        subtitle="Peringatan dan Info Sistem"
        rightActionLabel="Baca Semua"
        onPressRightAction={() => alert('Semua notifikasi ditandai sudah dibaca.')}
        onPressRightIcon={() => alert('Menyegarkan notifikasi...')}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <NotificationCard
          title="Suhu Air Tinggi"
          description="Suhu Kolam A2 mencapai 30.2C. Pertimbangkan untuk menambah aerasi."
          status="waspada"
          sourceLabel="Kolam A2"
          timeLabel="12 menit lalu"
          actionLabel="Tindakan"
          iconName="device-thermostat"
          onPressAction={() => alert('Tindakan: suhu air')}
        />
        <NotificationCard
          title="Pakan Otomatis Diberikan"
          description="Sesi pakan pagi (06:00) selesai. Total 8.5 kg untuk 3 kolam."
          status="info"
          sourceLabel="Semua Kolam"
          timeLabel="2 jam lalu"
          iconName="restaurant"
        />
        <NotificationCard
          title="Amonia Tinggi — Terdeteksi"
          description="Kadar amonia Kolam A2 mencapai 1.2 mg/L. Sistem menghentikan pakan otomatis!"
          status="bahaya"
          sourceLabel="Kolam A2"
          timeLabel="Kemarin 18:30"
          actionLabel="Tindakan"
          iconName="warning"
          onPressAction={() => alert('Tindakan: amonia')}
        />
        <NotificationCard
          title="Data Tersinkron ke Blockchain"
          description="Log operasional harian berhasil di-anchor ke blockchain. Data tidak dapat diubah."
          status="info"
          sourceLabel="Sistem"
          timeLabel="Kemarin 00:00"
          iconName="info"
        />
        <NotificationCard
          title="Filter Kolam Diganti"
          description="Penggantian filter Kolam B1 selesai. Sistem kembali normal."
          status="selesai"
          sourceLabel="Kolam B1"
          timeLabel="2 hari lalu"
          iconName="check-circle"
        />
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
});