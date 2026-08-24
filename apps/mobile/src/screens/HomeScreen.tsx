import { useEffect, useRef, useState } from "react";
import {
	Animated,
	Easing,
	Image,
	ImageBackground,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../theme";
import { strings } from "../i18n";
import { api } from "../services/api";
import type { Screen } from "../../App";

type Props = { navigate: (s: Screen) => void };

function Wiggle({
	deg,
	duration,
	pause,
	delay,
	style,
	children,
}: {
	deg: number;
	duration: number;
	pause: number;
	delay: number;
	style?: View["props"]["style"];
	children: React.ReactNode;
}) {
	const v = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const anim = Animated.loop(
			Animated.sequence([
				Animated.delay(delay),
				Animated.timing(v, {
					toValue: 1,
					duration,
					easing: Easing.inOut(Easing.quad),
					useNativeDriver: true,
				}),
				Animated.timing(v, {
					toValue: -1,
					duration: duration * 2,
					easing: Easing.inOut(Easing.quad),
					useNativeDriver: true,
				}),
				Animated.timing(v, {
					toValue: 0,
					duration,
					easing: Easing.inOut(Easing.quad),
					useNativeDriver: true,
				}),
				Animated.delay(pause),
			]),
		);
		anim.start();
		return () => anim.stop();
	}, [v, delay, duration, pause]);

	const rotate = v.interpolate({
		inputRange: [-1, 1],
		outputRange: [`-${deg}deg`, `${deg}deg`],
	});

	return (
		<Animated.View style={[style, { transform: [{ rotate }] }]}>
			{children}
		</Animated.View>
	);
}

function Bob({
	dist,
	duration,
	delay,
	style,
	children,
}: {
	dist: number;
	duration: number;
	delay: number;
	style?: View["props"]["style"];
	children: React.ReactNode;
}) {
	const v = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const anim = Animated.loop(
			Animated.sequence([
				Animated.delay(delay),
				Animated.timing(v, {
					toValue: 1,
					duration,
					easing: Easing.inOut(Easing.quad),
					useNativeDriver: true,
				}),
				Animated.timing(v, {
					toValue: 0,
					duration,
					easing: Easing.inOut(Easing.quad),
					useNativeDriver: true,
				}),
			]),
		);
		anim.start();
		return () => anim.stop();
	}, [v, delay, duration]);

	const translateY = v.interpolate({
		inputRange: [0, 1],
		outputRange: [0, -dist],
	});

	return (
		<Animated.View style={[style, { transform: [{ translateY }] }]}>
			{children}
		</Animated.View>
	);
}

function localTodayStr() {
	const now = new Date();
	const mm = String(now.getMonth() + 1).padStart(2, "0");
	const dd = String(now.getDate()).padStart(2, "0");
	return `${now.getFullYear()}-${mm}-${dd}`;
}

export default function HomeScreen({ navigate }: Props) {
	const [today, setToday] = useState({ pee: 0, poo: 0 });

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
							<Ionicons name="water" size={26} color="#56AEE2" />
						</Wiggle>
						<Text style={styles.chipText}>
							{strings.todayPee} {today.pee}
							{strings.times}
						</Text>
					</View>
					<View style={styles.chip}>
						<Wiggle deg={12} duration={260} pause={1800} delay={900}>
							<MaterialCommunityIcons
								name="emoticon-poop"
								size={26}
								color={theme.colors.poo}
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

				<View style={styles.tabBar}>
					<TouchableOpacity
						style={styles.tab}
						onPress={() => navigate({ name: "history" })}>
						<Ionicons
							name="journal-outline"
							size={30}
							color={theme.colors.primary}
						/>
						<Text style={styles.tabLabel}>{strings.log}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.tab}
						onPress={() => navigate({ name: "settings" })}>
						<Ionicons
							name="settings-outline"
							size={30}
							color={theme.colors.primary}
						/>
						<Text style={styles.tabLabel}>{strings.settings}</Text>
					</TouchableOpacity>
				</View>
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
	tabBar: {
		flexDirection: "row",
		backgroundColor: "#fcebd3",
		borderTopWidth: 1.5,
		borderTopColor: "#E9D8C8",
		paddingBottom: theme.spacing.sm,
		paddingTop: theme.spacing.md,
	},
	tab: {
		flex: 1,
		alignItems: "center",
		gap: 2,
	},
	tabLabel: {
		fontSize: 16,
		fontWeight: "700",
		color: theme.colors.text,
	},
});
