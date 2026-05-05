import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type ScheduleItem = {
  id: string;
  time: string;
  pondLabel: string;
  amountLabel: string;
  isCompleted?: boolean;
  isActive?: boolean;
  isInactive?: boolean;
};

type ScheduleSection = {
  id: string;
  title: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  items: ScheduleItem[];
};

const defaultSections: ScheduleSection[] = [
  {
    id: 'morning',
    title: 'Pagi Hari',
    iconName: 'wb-sunny',
    iconColor: '#F5A623',
    iconBg: '#FFF1D6',
    items: [
      {
        id: 'a1-0600',
        time: '06:00',
        pondLabel: 'Kolam A1',
        amountLabel: '2.8 kg',
        isCompleted: true,
        isActive: false,
        isInactive: true,
      },
      {
        id: 'a2-0600',
        time: '06:00',
        pondLabel: 'Kolam A2',
        amountLabel: '3.1 kg',
        isCompleted: true,
        isActive: true,
      },
      {
        id: 'b1-0605',
        time: '06:05',
        pondLabel: 'Kolam B1',
        amountLabel: '2.6 kg',
        isCompleted: true,
        isActive: true,
      },
    ],
  },
  {
    id: 'noon',
    title: 'Siang Hari',
    iconName: 'wb-sunny',
    iconColor: '#F2A116',
    iconBg: '#FFE9C9',
    items: [
      {
        id: 'a1-1200',
        time: '12:00',
        pondLabel: 'Kolam A1',
        amountLabel: '2.8 kg',
        isActive: true,
      },
      {
        id: 'a2-1200',
        time: '12:00',
        pondLabel: 'Kolam A2',
        amountLabel: '3.1 kg',
        isActive: true,
      },
      {
        id: 'b1-1205',
        time: '12:05',
        pondLabel: 'Kolam B1',
        amountLabel: '2.6 kg',
        isActive: true,
      },
    ],
  },
];

export function ScheduleListCard({
  sections = defaultSections,
}: {
  sections?: ScheduleSection[];
}) {
  const [data, setData] = useState(sections);

  const toggleItem = (sectionId: string, itemId: string) => {
    setData((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        return {
          ...section,
          items: section.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  isActive: !item.isActive,
                  isInactive: item.isActive,
                }
              : item
          ),
        };
      })
    );
  };

  return (
    <View style={styles.container}>
      {data.map((section) => (
        <View key={section.id} style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: section.iconBg }]}>
              <MaterialIcons
                name={section.iconName}
                size={16}
                color={section.iconColor}
              />
            </View>
            <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
          </View>
          <View style={styles.itemsWrap}>
            {section.items.map((item, index) => (
              <View key={item.id} style={styles.itemRow}>
                <View
                  style={[
                    styles.leftIcon,
                    item.isCompleted ? styles.leftIconDone : styles.leftIconDefault,
                  ]}
                >
                  <MaterialIcons
                    name={item.isCompleted ? 'check' : 'schedule'}
                    size={18}
                    color={item.isCompleted ? '#1E9E4B' : '#2F7BFF'}
                  />
                </View>
                <View style={styles.itemContent}>
                  <View style={styles.itemTopRow}>
                    <ThemedText style={styles.timeText}>{item.time}</ThemedText>
                    {item.isCompleted && (
                      <View style={[styles.statusPill, styles.statusDone]}>
                        <ThemedText style={styles.statusDoneText}>Selesai</ThemedText>
                      </View>
                    )}
                    {item.isInactive && (
                      <View style={[styles.statusPill, styles.statusInactive]}>
                        <ThemedText style={styles.statusInactiveText}>
                          Nonaktif
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <View style={styles.itemMetaRow}>
                    <MaterialIcons name="waves" size={14} color="#8A8F98" />
                    <ThemedText style={styles.metaText}>{item.pondLabel}</ThemedText>
                    <ThemedText style={styles.metaDivider}>•</ThemedText>
                    <ThemedText style={styles.metaText}>{item.amountLabel}</ThemedText>
                  </View>
                </View>
                <View style={styles.itemActions}>
                  <Switch
                    value={!!item.isActive}
                    onValueChange={() => toggleItem(section.id, item.id)}
                    trackColor={{
                      false: '#E1E4EA',
                      true: '#2F7BFF',
                    }}
                    thumbColor={item.isActive ? '#FFFFFF' : '#F2F2F2'}
                  />
                  <Pressable
                    onPress={() => alert('Hapus jadwal.')}
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed && styles.deletePressed,
                    ]}
                  >
                    <MaterialIcons name="delete-outline" size={20} color="#FF6B6B" />
                  </Pressable>
                </View>
                {index < section.items.length - 1 ? (
                  <View style={styles.itemDivider} />
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#11181C',
  },
  itemsWrap: {
    gap: 2,
  },
  itemRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  leftIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leftIconDone: {
    backgroundColor: '#DDF7E6',
  },
  leftIconDefault: {
    backgroundColor: '#E7F0FF',
  },
  itemContent: {
    flex: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#11181C',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDone: {
    backgroundColor: '#DFF6E7',
  },
  statusDoneText: {
    color: '#1E9E4B',
    fontSize: 11,
    fontWeight: '700',
  },
  statusInactive: {
    backgroundColor: '#EFF1F4',
  },
  statusInactiveText: {
    color: '#8A8F98',
    fontSize: 11,
    fontWeight: '700',
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  metaDivider: {
    color: '#C0C5CE',
    fontSize: 12,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 8,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePressed: {
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
  },
  itemDivider: {
    position: 'absolute',
    left: 54,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: '#EFF1F4',
  },
});
