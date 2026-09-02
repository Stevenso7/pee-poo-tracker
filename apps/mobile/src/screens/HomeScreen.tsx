import { useEffect, useState } from "react";
import {
	Alert,
	Image,
	ImageBackground,
	Modal,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../theme";
import { strings } from "../i18n";
import { api } from "../services/api";
import { TabBar } from "../components/TabBar";
import { Wiggle, Bob } from "../components/Animations";
import AIAnalysisModal from "../components/AIAnalysisModal";
import { Ionicons } from "@expo/vector-icons";
import type { Screen } from "../../App";

type Props = { navigate: (s: Screen) => void };

function localTodayStr() {
	const now = new Date();
	const mm = String(now.getMonth() + 1).padStart(2, "0");
	const dd = String(now.getDate()).padStart(2, "0");
	return `${now.getFullYear()}-${mm}-${dd}`;
}

export default function HomeScreen({ navigate }: Props) {
	const [today, setToday] = useState({ pee: 0, poo: 0 });
	const [showAIModal, setShowAIModal] = useState(false);
	const [aiSubmitting, setAISubmitting] = useState(false);

	const handleAISubmit = async (params: {
		type: "PEE" | "POO";
		days: number;
	}) => {
		setAISubmitting(true);
		try {
			const res = await api.batchAnalyze({ ...params, force: false });
			if (res.failedCount > 0) {
				const failedMsg = res.failed
					.map((f) => `${f.recordId.slice(0, 8)}: ${f.error}`)
					.join("\n");
				Alert.alert(
					"部分分析失敗",
					`成功 ${res.newCount} 次，失敗 ${res.failedCount} 次\n\n${failedMsg}`,
				);
			} else {
				Alert.alert("完成", `AI 分析完成！共分析 ${res.newCount} 次記錄`);
			}
			setShowAIModal(false);
		} catch (err) {
			Alert.alert(
				strings.error,
				err instanceof Error ? err.message : strings.pleaseTryAgain,
			);
		} finally {
			setAISubmitting(false);
		}
	};

	useEffect(() => {
		api
			.getSummary({ tz: -new Date().getTimezoneOffset() })
			.then((s) => {
				const todayStr = localTodayStr();
				const day = s.daily.find((d) => d.date === todayStr);
				setToday({ pee: day?.peeCount ?? 0, poo: day?.pooCount ?? 0 });
			})
			.catch(() => undefined);
	}, []);

	const [greetingLine1, greetingLine2] = strings.homeGreeting.split("？");

	return (
		<SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.title}>{greetingLine1}？</Text>
					<Text style={styles.title}>{greetingLine2}</Text>
				</View>

				<View style={styles.chips}>
					<View style={styles.chip}>
						<Wiggle deg={12} duration={260} pause={1800} delay={0}>
							<Image
								source={require("../../../api/src/assets/record_pee.png")}
								resizeMode="contain"
								style={styles.chipIcon}
							/>
						</Wiggle>
						<Text style={styles.chipText}>
							{strings.todayPee} {today.pee}
							{strings.times}
						</Text>
					</View>
					<View style={styles.chip}>
						<Wiggle deg={12} duration={260} pause={1800} delay={900}>
							<Image
								source={require("../../../api/src/assets/record_poo.png")}
								resizeMode="contain"
								style={styles.chipIcon}
							/>
						</Wiggle>
						<Text style={styles.chipText}>
							{strings.todayPoo} {today.poo}
							{strings.times}
						</Text>
					</View>
				</View>

				<View style={styles.cards}>
					<TouchableOpacity
						activeOpacity={0.82}
						onPress={() => navigate({ name: "log", type: "PEE" })}>
						<ImageBackground
							source={require("../../../api/src/assets/pee-background.png")}
							resizeMode="stretch"
							style={styles.card}>
							<Bob
								dist={7}
								duration={850}
								delay={0}
								style={styles.cardIconWrap}>
								<Image
									source={require("../../../api/src/assets/pee_icon.png")}
									resizeMode="contain"
									style={styles.cardIcon}
								/>
							</Bob>
							<Text style={styles.cardLabel}>{strings.pee}</Text>
						</ImageBackground>
					</TouchableOpacity>
					<TouchableOpacity
						activeOpacity={0.82}
						onPress={() => navigate({ name: "log", type: "POO" })}>
						<ImageBackground
							source={require("../../../api/src/assets/poo-background.png")}
							resizeMode="stretch"
							style={styles.card}>
							<Bob
								dist={7}
								duration={850}
								delay={420}
								style={styles.cardIconWrap}>
								<Image
									source={require("../../../api/src/assets/poo_icon.png")}
									resizeMode="contain"
									style={styles.cardIcon}
								/>
							</Bob>
							<Text style={styles.cardLabel}>{strings.poo}</Text>
						</ImageBackground>
					</TouchableOpacity>
				</View>

				<TouchableOpacity
					style={styles.aiButton}
					onPress={() => setShowAIModal(true)}>
					<Ionicons name="sparkles" size={28} color="#FFFFFF" />
					<Text style={styles.aiButtonText}>AI 分析</Text>
				</TouchableOpacity>

				<AIAnalysisModal
					visible={showAIModal}
					onClose={() => setShowAIModal(false)}
					onSubmit={handleAISubmit}
					submitting={aiSubmitting}
				/>

				<TabBar
					active="aiHistory"
					onTab={(tab) =>
						navigate({
							name: tab === 'log' ? 'history' : tab === 'aiHistory' ? 'aiHistory' : 'settings',
						})
					}
				/>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: theme.colors.background },
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	header: {
		alignItems: "center",
		marginTop: theme.spacing.lg,
	},
	title: {
		fontSize: 34,
		lineHeight: 46,
		fontWeight: "800",
		color: theme.colors.text,
		textAlign: "center",
	},
	chips: {
		flexDirection: "row",
		justifyContent: "center",
		gap: theme.spacing.md,
		marginTop: theme.spacing.lg,
	},
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: "#fcebd3",
		borderColor: "#D98A4B",
		borderWidth: 2,
		borderRadius: theme.radius.pill,
		paddingVertical: 10,
		paddingHorizontal: 16,
		shadowColor: "#C85A27",
		shadowOffset: { width: 2, height: 3 },
		shadowOpacity: 0.35,
		shadowRadius: 0,
		elevation: 3,
	},
	chipText: {
		fontSize: 17,
		fontWeight: "700",
		color: theme.colors.text,
	},
	chipIcon: { width: 26, height: 26 },
	cards: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: "8%",
	},
	card: {
		width: 150,
		aspectRatio: 272 / 395,
		alignItems: "center",
		justifyContent: "flex-end",
		paddingBottom: "11%",
	},
	cardIconWrap: {
		position: "absolute",
		top: "17%",
		width: "62%",
		aspectRatio: 208 / 222,
	},
	cardIcon: { width: "100%", height: "100%" },
	cardLabel: {
		fontSize: 30,
		fontWeight: "800",
		color: theme.colors.text,
		paddingBottom: theme.spacing.sm,
	},
	aiButton: {
		marginTop: theme.spacing.lg,
		marginBottom: theme.spacing.md,
		paddingVertical: theme.spacing.md,
		paddingHorizontal: theme.spacing.xl,
		borderRadius: theme.radius.lg,
		backgroundColor: theme.colors.primary,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: theme.spacing.sm,
		alignSelf: "center",
		shadowColor: theme.colors.primary,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 4,
	},
	aiButtonText: {
		color: "#FFFFFF",
		fontSize: 18,
		fontWeight: "800",
	},
});
