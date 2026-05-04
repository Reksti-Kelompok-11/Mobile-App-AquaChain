import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

type FilterStatusCardProps = {
  title?: string;
  percent?: number;
  description?: string;
  hasData?: boolean;
};

export function FilterStatusCard({
  title = "Kondisi Filter Kolam",
  percent = 82,
  description = "OK Filter berfungsi dengan baik, tidak perlu penggantian segera.",
  hasData = true,
}: FilterStatusCardProps) {
  const clamped = Math.max(0, Math.min(percent, 100));

  if (!hasData) {
    return (
      <View style={styles.card}>
        <ThemedText style={styles.emptyText}>
          Tidak ada filter terdeteksi.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={styles.percent}>{clamped}%</ThemedText>
      </View>
      <View style={styles.progressTrack}>
        <LinearGradient
          colors={["#148A35", "#42D36F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${clamped}%` }]}
        />
      </View>
      <ThemedText style={styles.description}>{description}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#11181C",
  },
  percent: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1FAE4B",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#EDEFF2",
    marginTop: 10,
    marginBottom: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#22B24C",
  },
  description: {
    fontSize: 12,
    color: "#70757E",
    lineHeight: 16,
  },
  emptyText: {
    fontSize: 12,
    color: "#70757E",
    lineHeight: 16,
    textAlign: "center",
  },
});
