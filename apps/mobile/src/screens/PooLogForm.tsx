import { useState } from "react";
import {
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
	POO_COLORS,
	POO_COLOR_LABELS,
	type PooColor,
} from "@pee-poo/shared";
import { theme } from "../theme";
import { strings } from "../i18n";
import { createRecordWithPhoto } from "../services/recordSubmission";
import { Bob, Pop } from "../components/Animations";
import type { Screen } from "../../App";

const POO_CONSISTENCY_MIN = 1;
const POO_CONSISTENCY_MAX = 7;

const POO_COLOR_PILL_BG: Record<PooColor, string> = {
	BROWN: "#E5C3A0",
	DARK_BROWN: "#E8DFD8",
	YELLOW: "#F8E9B8",
	GREEN: "#DCE9C6",
	BLACK: "#E8E5E3",
	RED: "#F5D3CB",
	PALE_CLAY: "#F3E6D2",
	GREY: "#DCDCDC",
};

const POO_COLOR_SHORT_LABELS: Record<PooColor, string> = {
	BROWN: "啡色",
	DARK_BROWN: "深啡",
	YELLOW: "黃色",
	GREEN: "綠色",
	BLACK: "黑色",
	RED: "紅色",
	PALE_CLAY: "泥色",
	GREY: "灰色",
};

const POO_CONSISTENCY_SHORT_LABELS: Record<number, string> = {
	1: "硬粒",
	2: "腸狀硬",
	3: "裂紋",
	4: "滑捋捋",
	5: "軟熟",
	6: "糊狀",
	7: "水狀",
};

const POO_SHAPE_ASSETS: Record<number, number> = {
	1: require("../../../api/src/assets/log_form/poo_shape_1.png"),
	2: require("../../../api/src/assets/log_form/poo_shape_2.png"),
	3: require("../../../api/src/assets/log_form/poo_shape_3.png"),
	4: require("../../../api/src/assets/log_form/poo_shape_4.png"),
	5: require("../../../api/src/assets/log_form/poo_shape_5.png"),
	6: require("../../../api/src/assets/log_form/poo_shape_6.png"),
	7: require("../../../api/src/assets/log_form/poo_shape_7.png"),
};

function PooShapeOption({
	value,
	selected,
	onPress,
}: {
	value: number;
	selected: boolean;
	onPress: () => void;
}) {
	return (
		<TouchableOpacity style={styles.optionWrap} onPress={onPress}>
			<Pop selected={selected}>
				<View style={[styles.poopTile, selected && styles.optionSelected]}>
					<Image
						source={POO_SHAPE_ASSETS[value]}
						resizeMode="contain"
						style={styles.poopShape}
					/>
					<Text style={styles.optionLabel}>
						{POO_CONSISTENCY_SHORT_LABELS[value]}
					</Text>
				</View>
			</Pop>
		</TouchableOpacity>
	);
}

export default function PooLogForm({
	navigate,
}: {
	navigate: (s: Screen) => void;
}) {
	const [pooColor, setPooColor] = useState<PooColor>();
	const [pooConsistency, setPooConsistency] = useState<number>();
	const [notes, setNotes] = useState("");
	const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const pickPhoto = async () => {
		const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!perm.granted) {
			Alert.alert(strings.error, "要相片權限先得呀");
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			quality: 0.7,
		});
		if (!result.canceled && result.assets[0]) {
			setPhoto(result.assets[0]);
		}
	};

	const takePhoto = async () => {
		const perm = await ImagePicker.requestCameraPermissionsAsync();
		if (!perm.granted) {
			Alert.alert(strings.error, "要相機權限先得呀");
			return;
		}
		const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
		if (!result.canceled && result.assets[0]) {
			setPhoto(result.assets[0]);
		}
	};

	const submit = async () => {
		setSubmitting(true);
		try {
			await createRecordWithPhoto({
				type: "POO",
				fields: {
					pooColor,
					pooConsistency,
					notes,
				},
				photo,
			});
			Alert.alert(strings.logSuccess);
			navigate({ name: "home" });
		} catch (err) {
			Alert.alert(
				strings.error,
				err instanceof Error ? err.message : strings.pleaseTryAgain,
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
			<View style={styles.panel}>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}>
					<View style={styles.header}>
						<TouchableOpacity
							style={styles.backButton}
							onPress={() => navigate({ name: "home" })}>
							<Ionicons name="arrow-undo" size={30} color="#E8853B" />
						</TouchableOpacity>
						<View style={styles.titleWrap}>
							<Image
								source={require("../../../api/src/assets/log_form/log_poo_icon.png")}
								resizeMode="contain"
								style={styles.titleIcon}
							/>
							<Text style={styles.title}>{strings.poo}</Text>
						</View>
						<Bob dist={4} duration={900} delay={300}>
							<Image
								source={require("../../../api/src/assets/log_form/log_poo_icon.png")}
								resizeMode="contain"
								style={styles.mascot}
							/>
						</Bob>
					</View>

					<View style={styles.section}>
						<Text style={styles.sectionTitle}>
							{strings.color}
							{pooColor ? (
								<Text style={styles.selectedLabel}>
									{" "}· {POO_COLOR_LABELS[pooColor]}
								</Text>
							) : null}
						</Text>
						<View style={styles.pillRow}>
							{POO_COLORS.map((c) => (
								<TouchableOpacity
									key={c}
									style={[
										styles.pill,
										{ backgroundColor: POO_COLOR_PILL_BG[c] },
										pooColor === c && styles.optionSelected,
									]}
									onPress={() => setPooColor(c)}>
									<Pop selected={pooColor === c} style={styles.pillPop}>
										<Text style={styles.pillText}>
											{pooColor === c ? "✓ " : ""}
											{POO_COLOR_SHORT_LABELS[c]}
										</Text>
									</Pop>
								</TouchableOpacity>
							))}
						</View>
					</View>

					<View style={styles.section}>
						<Text style={styles.sectionTitle}>
							{strings.consistency}
							{pooConsistency ? (
								<Text style={styles.selectedLabel}>
									{" "}· {POO_CONSISTENCY_SHORT_LABELS[pooConsistency]}
								</Text>
							) : null}
						</Text>
						<View style={styles.tileGrid}>
							{Array.from(
								{ length: POO_CONSISTENCY_MAX - POO_CONSISTENCY_MIN + 1 },
								(_, i) => POO_CONSISTENCY_MIN + i,
							).map((n) => (
								<PooShapeOption
									key={n}
									value={n}
									selected={pooConsistency === n}
									onPress={() => setPooConsistency(n)}
								/>
							))}
						</View>
					</View>

					<View style={styles.photoBox}>
						{photo ? (
							<View style={styles.photoPreviewWrap}>
								<Image source={{ uri: photo.uri }} style={styles.photoPreview} />
								<TouchableOpacity onPress={() => setPhoto(null)}>
									<Text style={styles.removePhoto}>{strings.removePhoto}</Text>
								</TouchableOpacity>
							</View>
						) : (
							<View style={styles.photoButtons}>
								<TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
									<Image
										source={require("../../../api/src/assets/log_form/log_form_take_photo.png")}
										resizeMode="contain"
										style={styles.photoButtonIcon}
									/>
									<Text style={styles.photoButtonText}>{strings.takePhoto}</Text>
								</TouchableOpacity>
								<TouchableOpacity style={styles.photoButton} onPress={pickPhoto}>
									<Image
										source={require("../../../api/src/assets/log_form/log_form_select_photo.png")}
										resizeMode="contain"
										style={styles.photoButtonIcon}
									/>
									<Text style={styles.photoButtonText}>{strings.pickPhoto}</Text>
								</TouchableOpacity>
							</View>
						)}
					</View>

					<TextInput
						style={styles.input}
						placeholder={strings.notes}
						placeholderTextColor={theme.colors.muted}
						value={notes}
						onChangeText={setNotes}
						multiline
					/>

					<TouchableOpacity
						style={[styles.submit, submitting && styles.submitDisabled]}
						onPress={submit}
						disabled={submitting}
						activeOpacity={0.82}>
						<Text style={styles.submitText}>
							{submitting ? strings.loading : strings.confirm}
						</Text>
					</TouchableOpacity>
				</ScrollView>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	panel: {
		flex: 1,
		backgroundColor: "#FDF3E7",
		borderColor: "#B97F4E",
		borderWidth: 1.5,
		borderRadius: 32,
		margin: theme.spacing.sm,
		overflow: "hidden",
	},
	scrollContent: {
		flexGrow: 1,
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.sm,
		justifyContent: "space-between",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
	},
	backButton: { padding: theme.spacing.xs },
	titleWrap: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
	title: {
		fontSize: 32,
		fontWeight: "800",
		color: theme.colors.text,
	},
	titleIcon: { width: 30, height: 28 },
	mascot: { width: 52, height: 48 },
	section: { gap: theme.spacing.md },
	sectionTitle: {
		fontSize: 19,
		fontWeight: "800",
		color: theme.colors.text,
		textAlign: "center",
	},
	selectedLabel: {
		fontSize: 14,
		fontWeight: "700",
		color: "#A85F45",
	},
	pillRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		columnGap: 10,
		rowGap: 10,
	},
	pill: {
		flexBasis: "22%",
		flexGrow: 1,
		paddingVertical: 11,
		borderRadius: 999,
		borderWidth: 2,
		borderColor: "#9C6B43",
		alignItems: "center",
		justifyContent: "center",
	},
	pillPop: { width: "100%" },
	pillText: {
		fontSize: 14,
		fontWeight: "700",
		color: "#5C4A32",
		textAlign: "center",
	},
	optionSelected: {
		borderColor: theme.colors.primary,
		borderWidth: 3.5,
		shadowColor: theme.colors.primary,
		shadowOpacity: 0.35,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 2 },
		elevation: 4,
	},
	tileGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		gap: 12,
	},
	optionWrap: { alignItems: "center" },
	poopTile: {
		width: 68,
		alignItems: "center",
		paddingVertical: 8,
		borderRadius: 14,
		backgroundColor: "#FFF8ED",
		borderWidth: 2,
		borderColor: "#D9B98A",
	},
	poopShape: { width: 52, height: 34 },
	optionLabel: {
		marginTop: 6,
		fontSize: 13,
		fontWeight: "700",
		color: theme.colors.text,
	},
	photoBox: {
		borderWidth: 2,
		borderColor: "#B97F4E",
		borderStyle: "dashed",
		borderRadius: 18,
		paddingVertical: theme.spacing.sm,
		paddingHorizontal: theme.spacing.md,
		alignItems: "center",
		marginTop: theme.spacing.md,
	},
	photoButtons: {
		flexDirection: "row",
		justifyContent: "space-around",
		width: "100%",
	},
	photoButton: { alignItems: "center", gap: 4 },
	photoButtonIcon: { width: 56, height: 50 },
	photoButtonText: {
		fontSize: 15,
		fontWeight: "700",
		color: theme.colors.text,
	},
	photoPreviewWrap: { alignItems: "center", gap: 6 },
	photoPreview: {
		width: 110,
		height: 110,
		borderRadius: 14,
		backgroundColor: theme.colors.surface,
	},
	removePhoto: {
		color: theme.colors.danger,
		fontWeight: "700",
	},
	input: {
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		backgroundColor: "#FFF8ED",
		borderWidth: 2,
		borderColor: "#D9B98A",
		borderRadius: 18,
		minHeight: 48,
		textAlignVertical: "top",
		color: theme.colors.text,
		fontSize: 15,
		marginTop: theme.spacing.md,
	},
submit: {
		backgroundColor: "#FF7B32",
		borderBottomColor: "#C85A27",
		borderBottomWidth: 6,
		borderRadius: 18,
		height: 56,
		alignItems: "center",
		justifyContent: "center",
		marginTop: theme.spacing.xl,
	},
	submitDisabled: { opacity: 0.65 },
	submitText: {
		color: "#FFFFFF",
		fontSize: 22,
		fontWeight: "800",
	},
});
