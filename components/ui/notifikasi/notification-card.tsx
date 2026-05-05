import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

type NotificationStatus = "bahaya" | "waspada" | "info" | "selesai";

type NotificationCardProps = {
  title: string;
  description: string;
  status: NotificationStatus;
  sourceLabel?: string;
  timeLabel?: string;
  actionLabel?: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  onPressAction?: () => void;
};

const statusStyles: Record<NotificationStatus, { accent: string; soft: string }> = {
  bahaya: { accent: "#E64646", soft: "#FFE8E8" },
  waspada: { accent: "#F2A116", soft: "#FFF2DB" },
  info: { accent: "#2F7BFF", soft: "#E7F0FF" },
  selesai: { accent: "#2BBE5D", soft: "#E5F7EC" },
};

const statusLabels: Record<NotificationStatus, string> = {
  bahaya: "Bahaya",
  waspada: "Waspada",
  info: "Info",
  selesai: "Selesai",
};

export function NotificationCard({
  title,
  description,
  status,
  sourceLabel,
  timeLabel,
  actionLabel = "Tindakan",
  iconName = "notifications",
  onPressAction,
}: NotificationCardProps) {
  const colors = statusStyles[status];

  return (
    <View style={[styles.card, { borderColor: colors.accent }]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: colors.soft }]}
        >
          <MaterialIcons name={iconName} size={18} color={colors.accent} />
        </View>
        <View style={styles.titleWrap}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText style={styles.description}>{description}</ThemedText>
        </View>
        <View style={[styles.statusPill, { backgroundColor: colors.soft }]}>
          <ThemedText style={[styles.statusText, { color: colors.accent }]}
          >
            {statusLabels[status]}
          </ThemedText>
        </View>
      </View>
      <View style={styles.footerRow}>
        <View style={styles.metaRow}>
          {!!sourceLabel && (
            <View style={styles.metaItem}>
              <View style={[styles.metaDot, { backgroundColor: colors.accent }]}
              />
              <ThemedText style={styles.metaText}>{sourceLabel}</ThemedText>
            </View>
          )}
          {!!timeLabel && (
            <View style={styles.metaItem}>
              <MaterialIcons name="schedule" size={14} color="#8A8F98" />
              <ThemedText style={styles.metaText}>{timeLabel}</ThemedText>
            </View>
          )}
        </View>
        {!!onPressAction && (
          <Pressable onPress={onPressAction} style={styles.actionRow}>
            <ThemedText style={[styles.actionText, { color: colors.accent }]}
            >
              {actionLabel}
            </ThemedText>
            <MaterialIcons name="chevron-right" size={18} color={colors.accent} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#11181C",
  },
  description: {
    fontSize: 12,
    color: "#70757E",
    lineHeight: 16,
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metaText: {
    fontSize: 11,
    color: "#8A8F98",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
