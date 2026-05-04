import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Dimensions, StyleSheet, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

import { ThemedText } from "@/components/themed-text";

type Metric = {
  id: string;
  title: string;
  subtitle: string;
  value: string;
  unit: string;
  chartData: number[];
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  valueColor: string;
  chartColor: string;
  chartFill: string;
};

const placeholderMetrics: Metric[] = [
  {
    id: "ph",
    title: "Tingkat pH Air",
    subtitle: "Normal: 6.5 - 9.0",
    value: "7.2",
    unit: "pH",
    chartData: [6.8, 7.1, 7.6, 7.4, 7.8, 7.6, 7.9],
    statusLabel: "Aman",
    statusColor: "#1E7A3E",
    statusBg: "rgba(46, 184, 92, 0.16)",
    iconName: "opacity",
    iconColor: "#2F7BFF",
    iconBg: "rgba(47, 123, 255, 0.12)",
    valueColor: "#2F7BFF",
    chartColor: "#2F7BFF",
    chartFill: "rgba(47, 123, 255, 0.12)",
  },
  {
    id: "temp",
    title: "Suhu Air",
    subtitle: "Normal: 24 - 30 C",
    value: "28.5",
    unit: "C",
    chartData: [26.4, 27.2, 28.3, 29.0, 28.7, 28.1, 28.6],
    statusLabel: "Aman",
    statusColor: "#1E7A3E",
    statusBg: "rgba(46, 184, 92, 0.16)",
    iconName: "device-thermostat",
    iconColor: "#E53935",
    iconBg: "rgba(229, 57, 53, 0.12)",
    valueColor: "#E53935",
    chartColor: "#E53935",
    chartFill: "rgba(229, 57, 53, 0.12)",
  },
  {
    id: "turbidity",
    title: "Kekeruhan Air",
    subtitle: "Normal: 0 - 25 NTU",
    value: "12",
    unit: "NTU",
    chartData: [6, 9, 12, 16, 7, 10, 12],
    statusLabel: "Aman",
    statusColor: "#1E7A3E",
    statusBg: "rgba(46, 184, 92, 0.16)",
    iconName: "visibility",
    iconColor: "#FB8C00",
    iconBg: "rgba(251, 140, 0, 0.12)",
    valueColor: "#FB8C00",
    chartColor: "#FB8C00",
    chartFill: "rgba(251, 140, 0, 0.12)",
  },
];

function MetricCard({ metric }: { metric: Metric }) {
  const chartWidth = Math.min(180, Dimensions.get("window").width * 0.42);

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIconWrap, { backgroundColor: metric.iconBg }]}>
          <MaterialIcons name={metric.iconName} size={20} color={metric.iconColor} />
        </View>
        <View style={styles.metricTitleWrap}>
          <ThemedText style={styles.metricTitle}>{metric.title}</ThemedText>
          <ThemedText style={styles.metricSubtitle}>{metric.subtitle}</ThemedText>
        </View>
        <View style={[styles.metricStatusPill, { backgroundColor: metric.statusBg }]}>
          <MaterialIcons name="check" size={12} color={metric.statusColor} />
          <ThemedText style={[styles.metricStatusText, { color: metric.statusColor }]}
          >
            {metric.statusLabel}
          </ThemedText>
        </View>
      </View>
      <View style={styles.metricBody}>
        <View style={styles.metricValueWrap}>
          <ThemedText style={[styles.metricValue, { color: metric.valueColor }]}
          >
            {metric.value}
          </ThemedText>
          <ThemedText style={[styles.metricUnit, { color: metric.valueColor }]}
          >
            {metric.unit}
          </ThemedText>
        </View>
        <View style={styles.metricChartWrap}>
          <LineChart
            data={{
              labels: metric.chartData.map(() => ""),
              datasets: [{ data: metric.chartData, color: () => metric.chartColor }],
            }}
            width={chartWidth}
            height={70}
            withDots={false}
            withShadow
            withInnerLines={false}
            withOuterLines={false}
            withHorizontalLabels={false}
            withVerticalLabels={false}
            bezier
            chartConfig={{
                backgroundGradientFrom: "transparent",
                backgroundGradientTo: "transparent",
                fillShadowGradient: metric.chartColor,
                fillShadowGradientOpacity: 0.14,
                color: () => metric.chartColor,
                backgroundGradientFromOpacity: 0,
                backgroundGradientToOpacity: 0,
                strokeWidth: 4,
            }}
            style={styles.metricChart}
          />
        </View>
      </View>
    </View>
  );
}

export function MonitorMetricCards({
  items,
  selectedKolamId,
}: {
  items?: Metric[];
  selectedKolamId?: string;
}) {
  const data = items ?? placeholderMetrics;

  if (selectedKolamId && selectedKolamId !== "1") {
    return (
      <View style={styles.metricsWrap}>
        <View style={styles.emptyCard}>
          <ThemedText style={styles.emptyText}>
            Tidak ada data untuk kolam ini.
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.metricsWrap}>
      {data.map((metric) => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  metricsWrap: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#8A8F98",
    fontWeight: "600",
  },
  metricCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  metricTitleWrap: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#11181C",
  },
  metricSubtitle: {
    fontSize: 14,
    color: "#8A8F98",
  },
  metricStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  metricStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  metricBody: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  metricValueWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 12,
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 36,
    color: "#11181C",
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    color: "#11181C",
  },
  metricChartWrap: {
    flex: 1,
    height: 60,
    marginLeft: 8,
    marginRight: -24,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  metricChart: {
    paddingRight: 0,
    paddingLeft: 0,
    marginLeft: 0,
    alignSelf: "flex-end",
  },
});
