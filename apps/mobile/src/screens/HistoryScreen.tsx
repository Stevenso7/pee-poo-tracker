import { useEffect, useState } from "react";
import {
	FlatList,
	Image,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { RECORD_TYPE_LABELS } from "@pee-poo/shared";
import { theme } from "../theme";
import { strings } from "../i18n";
import { api, type RecordItem } from "../services/api";
import { TabBar } from "../components/TabBar";
import type { Screen } from "../../App";

function dayLabel(d: Date) {
	const startOfDay = (x: Date) =>
		new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
	const diffDays = Math.round(
		(startOfDay(new Date()) - startOfDay(d)) / 86_400_000,
	);
	if (diffDays === 0) return strings.today;
	if (diffDays === 1) return strings.yesterday;
	return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function timeLabel(d: Date) {
	const hh = String(d.getHours()).padStart(2, "0");
	const mm = String(d.getMinutes()).padStart(2, "0");
	return `${hh}:${mm}`;
}

export default function HistoryScreen({
	navigate,
}: {
	navigate: (s: Screen) => void;
}) {
	const [items, setItems] = useState<RecordItem[]>([]);

	useEffect(() => {
		api
			.listRecords()
			.then((res) => setItems(res.items))
			.catch(() => undefined);
	}, []);

	return (
		<SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
			<View style={styles.header}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => navigate({ name: "home" })}>
					<Ionicons name="chevron-back" size={30} color={theme.colors.text} />
				</TouchableOpacity>
				<View style={styles.titleWrap}>
					<Image
						source={require("../../../api/src/assets/record_icon.png")}
						resizeMode="contain"
						style={styles.titleIcon}
					/>
					<Text style={styles.title}>{strings.log}</Text>
				</View>
				<View style={styles.headerSpacer} />
			</View>

			{items.length === 0 ? (
				<Text style={styles.empty}>{strings.empty}</Text>
			) : (
				<FlatList
					contentContainerStyle={styles.list}
					data={items}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => {
						const recordedAt = new Date(item.recordedAt);
						return (
							<TouchableOpacity
								style={styles.card}
								activeOpacity={0.8}
								onPress={() => navigate({ name: "detail", id: item.id })}>
								<Image
									source={
										item.type === "PEE"
											? require("../../../api/src/assets/record_pee.png")
											: require("../../../api/src/assets/record_poo.png")
									}
									resizeMode="contain"
									style={styles.icon}
								/>
								<View style={styles.info}>
									<Text style={styles.datetime}>
										{dayLabel(recordedAt)} {timeLabel(recordedAt)}
									</Text>
									<Text style={styles.type}>
										{RECORD_TYPE_LABELS[item.type]}
									</Text>
								</View>
								<View style={styles.badges}>
									{item.photoStoragePath ? (
										<View style={[styles.badge, styles.badgePhoto]}>
											<Ionicons name="camera" size={14} color="#5C4A32" />
										</View>
									) : null}
									{item.analysis?.status === "COMPLETED" ? (
										<View style={[styles.badge, styles.badgeAi]}>
											<Ionicons name="sparkles" size={14} color="#5C4A32" />
											<Text style={styles.badgeText}>{strings.aiAnalysis}</Text>
										</View>
									) : null}
								</View>
							</TouchableOpacity>
						);
					}}
				/>
			)}

			<TabBar
				active="log"
				onTab={(tab) =>
					navigate({ name: tab === "log" ? "history" : "settings" })
				}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: theme.spacing.md,
		paddingTop: theme.spacing.sm,
		paddingBottom: theme.spacing.md,
	},
	backButton: { padding: theme.spacing.xs },
	headerSpacer: { width: 38 },
	titleWrap: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
	title: {
		fontSize: 30,
		fontWeight: "800",
		color: theme.colors.text,
	},
	titleIcon: { width: 30, height: 30 },
	empty: {
		color: theme.colors.muted,
		fontSize: 16,
		textAlign: "center",
		marginTop: theme.spacing.xl,
	},
	list: {
		padding: theme.spacing.lg,
		paddingTop: theme.spacing.sm,
		gap: theme.spacing.md,
	},
	card: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		padding: theme.spacing.md,
		gap: theme.spacing.md,
		shadowColor: "#C85A27",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.12,
		shadowRadius: 6,
		elevation: 3,
	},
	icon: { width: 56, height: 64 },
	info: { flex: 1, gap: 2 },
	datetime: {
		fontSize: 22,
		fontWeight: "800",
		color: theme.colors.text,
	},
	type: {
		fontSize: 20,
		fontWeight: "700",
		color: theme.colors.text,
	},
	badges: {
		flexDirection: "row",
		gap: 6,
		alignSelf: "flex-end",
	},
	badge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 3,
		borderRadius: theme.radius.pill,
		paddingVertical: 5,
		paddingHorizontal: 10,
	},
	badgePhoto: { backgroundColor: "#D9B98A" },
	badgeAi: { backgroundColor: "#F9CF4F" },
	badgeText: {
		fontSize: 14,
		fontWeight: "700",
		color: "#5C4A32",
	},
});
