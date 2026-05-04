import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { KolamSelector } from '@/components/ui/kolam-selector';
import { PageHeader } from '@/components/ui/page-header';

export default function HomeScreen() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const timeLabel = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <ThemedView style={styles.screen}>
      <PageHeader 
        title="Selamat Pagi, Wijak" 
        subtitle={`Waktu Real Time : ${timeLabel} WIB`}
        onPressRightIcon={() => alert('Menyegarkan notifikasi...')}
      >
        <View style={styles.alertPill}>
          <View style={styles.alertIcon}>
            <MaterialIcons name="warning" size={18} color="#1F1F1F" />
          </View>
          <ThemedText style={styles.alertText}>2 Kolam Perlu Diperhatikan</ThemedText>
        </View>
      </PageHeader>
      <KolamSelector />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F2F2F2',
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
