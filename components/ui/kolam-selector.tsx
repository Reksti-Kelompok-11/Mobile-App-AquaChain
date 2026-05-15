import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

type Kolam = {
  id: string;
  name: string;
  status?: string | null;
};

const kolamData: Kolam[] = [
  { id: "1", name: "Kolam A1", status: "Baik" },
  { id: "2", name: "Kolam A2", status: "Sedang" },
  { id: "3", name: "Kolam B1", status: "Bahaya" },
];

const statusColors = {
  Baik: "#28a745",
  Sedang: "#ffc107",
  Bahaya: "#dc3545",
} as const;

type StatusKey = keyof typeof statusColors;

function normalizeStatus(status?: string | null): StatusKey {
  if (!status) return "Sedang";
  const value = status.trim().toLowerCase();

  if (["baik", "aman", "normal", "ok"].includes(value)) return "Baik";
  if (["bahaya", "buruk", "danger", "critical"].includes(value)) return "Bahaya";
  if (["sedang", "waspada", "warning"].includes(value)) return "Sedang";

  return "Sedang";
}

export function KolamCard({
  kolam,
  isSelected,
  onPress,
}: {
  kolam: Kolam;
  isSelected: boolean;
  onPress: () => void;
}) {
  const statusKey = normalizeStatus(kolam.status);
  const statusColor = statusColors[statusKey];
  const cardStyle = {
    ...styles.card,
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    borderColor: isSelected ? "#2F7BFF" : "#E6E6E6",
    borderWidth: 2,
  };

  return (
    <Pressable onPress={onPress}>
      <ThemedView style={cardStyle}>
        <ThemedText
          style={[
            styles.cardTitle,
            isSelected
              ? styles.cardTitleSelected
              : { color: "#000" },
          ]}
        >
          {kolam.name}
        </ThemedText>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: statusColor },
            ]}
          />
          <ThemedText style={{ color: statusColor }}>
            {statusKey}
          </ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}

export function KolamSelector({
  items = kolamData,
  selectedId,
  onSelect,
}: {
  items?: Kolam[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  const [internalSelectedId, setInternalSelectedId] = useState(
    items[0]?.id ?? "",
  );
  const activeId = selectedId ?? internalSelectedId;

  const handleSelect = (id: string) => {
    setInternalSelectedId(id);
    onSelect?.(id);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {items.map((kolam) => (
        <KolamCard
          key={kolam.id}
          kolam={kolam}
          isSelected={activeId === kolam.id}
          onPress={() => handleSelect(kolam.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    alignSelf: "flex-start",
    marginHorizontal: 4,
    minWidth: 130,
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 6,
  },
  cardTitleSelected: {
    color: "#2F7BFF",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
});
