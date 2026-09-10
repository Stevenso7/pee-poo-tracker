import { useEffect, useState, useMemo } from "react";
import {
	Image,
	SectionList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	type SectionListData,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { RECORD_TYPE_LABELS } from "@pee-poo/shared";
import { theme } from "../theme";
import { strings } from "../i18n";
import { api, type RecordItem } from "../services/api";
import { TabBar } from "../components/TabBar";
import type { Screen } from "../../App";

type FilterType = "ALL" | "PEE" | "POO";

type SectionMeta = { key: string; title?: string };

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

function dateKey(d: Date) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function HistoryScreen({
	navigate,
}: {
	navigate: (s: Screen) => void;
}) {
	const [items, setItems] = useState<RecordItem[]>([]);
	const [filter, setFilter] = useState<"ALL" | "PEE" | "POO">("ALL");

	useEffect(() => {
		api
			.listRecords()
			.then((res) => setItems(res.items))
			.catch(() => undefined);
	}, []);

	const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;
	const todayItems = items.filter((item) => {
		const d = new Date(item.recordedAt);
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
		return key === todayStr;
	});
	const todayPee = todayItems.filter((i) => i.type === "PEE").length;
	const todayPoo = todayItems.filter((i) => i.type === "POO").length;

	const filteredItems = useMemo(() => {
		if (filter === "ALL") return items;
		return items.filter((i) => i.type === filter);
	}, [items, filter]);

	const dateSections = useMemo(() => {
		const groups: Record<string, RecordItem[]> = {};
		for (const item of filteredItems) {
			const key = dateKey(new Date(item.recordedAt));
			if (!groups[key]) groups[key] = [];
			groups[key].push(item);
		}
		for (const key of Object.keys(groups)) {
			groups[key].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
		}
		const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
		return sortedKeys.map((key) => ({
			title: dayLabel(new Date(groups[key][0].recordedAt)),
			data: groups[key],
			key: `date-${key}`,
		}));
	}, [filteredItems]);

	const sections = useMemo<SectionListData<any, SectionMeta>[]>(
		() => [
			{
				data: [{ todayPee, todayPoo }],
				key: "summary",
				renderItem: () => (
					<View style={styles.summaryCard}>
						<View style={styles.summaryRow}>
							<View style={[styles.summaryItem, styles.summaryPee]}>
								<Image
									source={require("../../../api/src/assets/record_pee.png")}
									style={styles.summaryIcon}
								/>
								<Text style={styles.summaryLabel}>{strings.todayPee}</Text>
								<Text style={styles.summaryCount}>{todayPee} {strings.times}</Text>
							</View>
							<View style={[styles.summaryItem, styles.summaryPoo]}>
								<Image
									source={require("../../../api/src/assets/record_poo.png")}
									style={styles.summaryIcon}
								/>
								<Text style={styles.summaryLabel}>{strings.todayPoo}</Text>
								<Text style={styles.summaryCount}>{todayPoo} {strings.times}</Text>
							</View>
						</View>
					</View>
				),
			},
			{
				data: [{ filter }],
				key: "filter",
				renderItem: ({ item }: { item: FilterType }) => (
					<View style={styles.filterTabs}>
						{(["ALL", "PEE", "POO"] as const).map((f) => (
							<TouchableOpacity
								key={f}
								style={[
									styles.filterTab,
									filter === f && styles.filterTabActive,
								]}
								onPress={() => setFilter(f as "ALL" | "PEE" | "POO")}>
									<Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
										{f === "ALL"
											? "全部"
											: f === "PEE"
											? strings.pee
											: strings.poo}
									</Text>
								</TouchableOpacity>
							))}
					</View>
				),
			},
			...dateSections,
		],
		[dateSections, filter, todayPee, todayPoo],
	);

	const renderItem = ({ item, section }: { item: any; section: SectionMeta }) => {
		if (section.key === "summary" || section.key === "filter") return null;
		const recordType = item.type as "PEE" | "POO";
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
						{timeLabel(new Date(item.recordedAt))}
					</Text>
					<Text style={styles.type}>
						{RECORD_TYPE_LABELS[recordType]}
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
		};

	const renderSectionHeader = ({ section }: { section: SectionMeta }) => {
		if (section.key === "summary" || section.key === "filter") return null;
		return (
			<View style={styles.sectionHeader}>
				<Text style={styles.sectionHeaderText}>{section.title}</Text>
			</View>
		);
	};

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

			<SectionList
				sections={sections}
				renderItem={renderItem}
				renderSectionHeader={renderSectionHeader}
				ListEmptyComponent={
					<View style={styles.empty}>
						<Text style={styles.emptyText}>{strings.empty}</Text>
						<Text style={styles.emptyHint}>去分析幾筆記錄試試啦 💧💩</Text>
					</View>
				}
				contentContainerStyle={styles.list}
				stickySectionHeadersEnabled={true}
			/>

			<TabBar
				active="log"
				onTab={(tab) =>
					navigate({
						name: tab === "log" ? "history" : tab === "aiHistory" ? "aiHistory" : "settings",
					})
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
	summaryCard: {
		backgroundColor: theme.colors.surface,
		borderRadius: 24,
		marginHorizontal: theme.spacing.lg,
		marginBottom: theme.spacing.md,
		padding: theme.spacing.md,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	summaryRow: {
		flexDirection: "row",
		justifyContent: "space-around",
	},
	summaryItem: {
		flex: 1,
		alignItems: "center",
		gap: 6,
	},
	summaryPee: {},
	summaryPoo: {},
	summaryIcon: { width: 28, height: 32 },
	summaryLabel: {
		fontSize: 13,
		fontWeight: "600",
		color: theme.colors.muted,
	},
	summaryCount: {
		fontSize: 22,
		fontWeight: "800",
		color: theme.colors.text,
	},
	filterTabs: {
		flexDirection: "row",
		backgroundColor: theme.colors.surface,
		borderRadius: 16,
		marginHorizontal: theme.spacing.lg,
		marginBottom: theme.spacing.md,
		padding: 4,
	},
	filterTab: {
		flex: 1,
		paddingVertical: theme.spacing.sm,
		borderRadius: 12,
		alignItems: "center",
	},
	filterTabActive: {
		backgroundColor: theme.colors.primary,
	},
	filterTabText: {
		fontSize: 15,
		fontWeight: "700",
		color: theme.colors.text,
	},
	filterTabTextActive: {
		color: "#FFFFFF",
	},
	section: {
		marginBottom: theme.spacing.md,
	},
	sectionHeader: {
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.xs,
		backgroundColor: "#FFF8ED",
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
	},
	sectionHeaderText: {
		fontSize: 14,
		fontWeight: "700",
		color: "#A85F45",
	},
	list: {
		paddingHorizontal: theme.spacing.lg,
		paddingTop: theme.spacing.sm,
		gap: theme.spacing.md,
		paddingBottom: 140,
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
	empty: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: theme.spacing.sm,
		marginTop: theme.spacing.xl,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.text,
	},
	emptyHint: {
		color: theme.colors.muted,
		fontSize: 14,
	},
});