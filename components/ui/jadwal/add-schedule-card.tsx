import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type AddScheduleCardProps = {
  kolamValue: string;
  waktuValue: string;
  onChangeKolam: (value: string) => void;
  onChangeWaktu: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function AddScheduleCard({
  kolamValue,
  waktuValue,
  onChangeKolam,
  onChangeWaktu,
  onSave,
  onCancel,
}: AddScheduleCardProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [timeValue, setTimeValue] = useState(() => parseTime(waktuValue));

  const handleOpenPicker = () => {
    setShowPicker(true);
  };

  const handleTimeChange = (_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (!selected) {
      return;
    }

    setTimeValue(selected);
    onChangeWaktu(formatTime(selected));
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name="add" size={18} color="#2F7BFF" />
        <ThemedText style={styles.title}>Tambah Jadwal Baru</ThemedText>
      </View>
      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Pilih Kolam</ThemedText>
        <View style={styles.inputWrap}>
          <TextInput
            value={kolamValue}
            onChangeText={onChangeKolam}
            placeholder="Pilih Kolam"
            placeholderTextColor="#9AA3AF"
            style={styles.inputText}
          />
          <MaterialIcons name="expand-more" size={22} color="#11181C" />
        </View>
      </View>
      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Waktu Pemberian</ThemedText>
        <Pressable
          onPress={handleOpenPicker}
          style={({ pressed }) => [
            styles.inputWrap,
            pressed && styles.inputPressed,
          ]}
        >
          <ThemedText style={styles.inputText}>
            {waktuValue || '07:00'}
          </ThemedText>
          <MaterialIcons name="schedule" size={20} color="#11181C" />
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={timeValue}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            textColor={Platform.OS === 'ios' ? '#000000' : undefined}
            onChange={handleTimeChange}
          />
        )}
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={onSave}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <ThemedText style={styles.primaryButtonText}>Simpan</ThemedText>
        </Pressable>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [
            styles.outlineButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <ThemedText style={styles.outlineButtonText}>Batal</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#2F7BFF',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#11181C',
  },
  fieldGroup: {
    marginTop: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 8,
  },
  inputWrap: {
    borderWidth: 1.5,
    borderColor: '#CFE0FF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
    paddingRight: 8,
  },
  inputPressed: {
    opacity: 0.9,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#2F7BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  outlineButton: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D6D9E2',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  outlineButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

function parseTime(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return new Date();
  }

  const hours = Math.min(23, Math.max(0, Number(match[1])));
  const minutes = Math.min(59, Math.max(0, Number(match[2])));
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return now;
}

function formatTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
