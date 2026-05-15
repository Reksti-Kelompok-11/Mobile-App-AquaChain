import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type AddScheduleCardProps = {
  ponds: PondOption[];
  selectedPondId: string | null;
  waktuValue: string;
  isSaveDisabled?: boolean;
  onSelectPond: (value: string) => void;
  onChangeWaktu: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

type PondOption = {
  id: string;
  label: string;
  status?: string | null;
};

export function AddScheduleCard({
  ponds,
  selectedPondId,
  waktuValue,
  isSaveDisabled = false,
  onSelectPond,
  onChangeWaktu,
  onSave,
  onCancel,
}: AddScheduleCardProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [timeValue, setTimeValue] = useState(() => parseTime(waktuValue));
  const [showPondOptions, setShowPondOptions] = useState(false);
  const selectedPondLabel =
    ponds.find((pond) => pond.id === selectedPondId)?.label ?? 'Pilih Kolam';

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
        <Pressable
          onPress={() => setShowPondOptions((prev) => !prev)}
          style={({ pressed }) => [
            styles.inputWrap,
            pressed && styles.inputPressed,
          ]}
        >
          <ThemedText
            style={[
              styles.inputText,
              !selectedPondId && styles.placeholderText,
            ]}
          >
            {selectedPondLabel}
          </ThemedText>
          <MaterialIcons name="expand-more" size={22} color="#11181C" />
        </Pressable>
        {showPondOptions && (
          <View style={styles.optionList}>
            {ponds.length === 0 ? (
              <ThemedText style={styles.emptyText}>
                Belum ada kolam tersedia.
              </ThemedText>
            ) : (
              ponds.map((pond) => (
                <Pressable
                  key={pond.id}
                  onPress={() => {
                    onSelectPond(pond.id);
                    setShowPondOptions(false);
                  }}
                  style={({ pressed }) => [
                    styles.optionRow,
                    pond.id === selectedPondId && styles.optionRowActive,
                    pressed && styles.optionRowPressed,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.optionText,
                      pond.id === selectedPondId && styles.optionTextActive,
                    ]}
                  >
                    {pond.label}
                  </ThemedText>
                </Pressable>
              ))
            )}
          </View>
        )}
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
          disabled={isSaveDisabled}
          style={({ pressed }) => [
            styles.primaryButton,
            isSaveDisabled && styles.primaryButtonDisabled,
            pressed && !isSaveDisabled && styles.buttonPressed,
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
  placeholderText: {
    color: '#9AA3AF',
  },
  inputPressed: {
    opacity: 0.9,
  },
  optionList: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  optionRowActive: {
    backgroundColor: '#EEF4FF',
  },
  optionRowPressed: {
    backgroundColor: '#F5F7FA',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#11181C',
  },
  optionTextActive: {
    color: '#2F7BFF',
  },
  emptyText: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 12,
    color: '#6B7280',
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
  primaryButtonDisabled: {
    backgroundColor: '#A9C6FF',
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
