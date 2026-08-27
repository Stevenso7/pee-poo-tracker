import { useEffect, useRef, useState } from "react";
import {
	Alert,
	Animated,
	Easing,
	Image,
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
	PEE_COLORS,
	PEE_FOAMS,
	PEE_VOLUMES,
	PEE_COLOR_LABELS,
	PEE_FOAM_LABELS,
	PEE_VOLUME_LABELS,
	type PeeColor,
	type PeeFoam,
	type PeeVolume,
} from "@pee-poo/shared";
import { theme } from "../theme";
import { strings } from "../i18n";
import { createRecordWithPhoto } from "../services/recordSubmission";
import { Bob, Pop } from "../components/Animations";
import type { Screen } from "../../App";

const PEE_COLOR_HEX: Record<PeeColor, string> = {
	TRANSPARENT: "#EFEFE6",
	PALE_YELLOW: "#F6E7A2",
	YELLOW: "#F5D04C",
	DARK_YELLOW: "#E3A92E",
	AMBER: "#C8882A",
	BROWN: "#9A6B32",
	RED_PINK: "#E08A80",
	BLUE_GREEN: "#7FBFA0",
	CLOUDY: "#D9D9C7",
};

const FOAM_BUBBLE_COUNTS: Record<PeeFoam, number> = {
	NONE: 0,
	SLIGHT: 2,
	MODERATE: 4,
	HEAVY: 7,
};

const VOLUME_FILL: Record<PeeVolume, number> = {
	SMALL: 0.35,
	MEDIUM: 0.66,
	LARGE: 1,
};

function BubbleCluster({ count }: { count: number }) {
	return (
		<View style={styles.bubbleCluster}>
			{Array.from({ length: count }).map((_, i) => (
				<View
					key={i}
					style={[styles.bubble, i % 3 === 0 && styles.bubbleBig]}
				/>
			))}
			{count === 0 ? (
				<Ionicons name="ban" size={20} color="#C9B4A0" />
			) : null}
		</View>
	);
}

function FoamOption({
	value,
	selected,
	onPress,
}: {
	value: PeeFoam;
	selected: boolean;
	onPress: () => void;
}) {
	return (
		<TouchableOpacity style={styles.optionWrap} onPress={onPress}>
			<Pop selected={selected}>
				<View style={[styles.foamCircle, selected && styles.optionSelected]}>
					<BubbleCluster count={FOAM_BUBBLE_COUNTS[value]} />
				</View>
			</Pop>
			<Text style={styles.optionLabel}>{PEE_FOAM_LABELS[value]}</Text>
		</TouchableOpacity>
	);
}

function VolumeCup({
	value,
	selected,
	onPress,
}: {
	value: PeeVolume;
	selected: boolean;
	onPress: () => void;
}) {
	const fill = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.timing(fill, {
			toValue: selected ? VOLUME_FILL[value] : 0,
			duration: 320,
			easing: Easing.out(Easing.quad),
			useNativeDriver: false,
		}).start();
	}, [selected, fill, value]);

	return (
		<TouchableOpacity style={styles.optionWrap} onPress={onPress}>
			<Pop selected={selected}>
				<View style={[styles.cup, selected && styles.optionSelected]}>
					<Animated.View
						style={[styles.cupFill, { height: Animated.multiply(fill, 50) }]}
					>
						<View style={styles.cupBubble} />
					</Animated.View>
				</View>
			</Pop>
			<Text style={styles.optionLabel}>{PEE_VOLUME_LABELS[value]}</Text>
		</TouchableOpacity>
	);
}

export default function PeeLogForm({
	navigate,
}: {
	navigate: (s: Screen) => void;
}) {
	const [peeColor, setPeeColor] = useState<PeeColor>();
	const [peeFoam, setPeeFoam] = useState<PeeFoam>();
	const [peeVolume, setPeeVolume] = useState<PeeVolume>();
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
				type: "PEE",
				fields: { peeColor, peeFoam, peeVolume, notes },
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
				<View style={styles.header}>
					<TouchableOpacity
						style={styles.backButton}
						onPress={() => navigate({ name: "home" })}>
						<Ionicons name="arrow-undo" size={30} color="#E8853B" />
					</TouchableOpacity>
					<View style={styles.titleWrap}>
						<Image
							source={require("../../../api/src/assets/log_form/log_form_water_drop_icon.png")}
							resizeMode="contain"
							style={styles.titleIcon}
						/>
						<Text style={styles.title}>{strings.pee}</Text>
					</View>
					<Bob dist={4} duration={900} delay={0}>
						<Image
							source={require("../../../api/src/assets/log_form/log_pee_icon.png")}
							resizeMode="contain"
							style={styles.mascot}
						/>
					</Bob>
				</View>

				<Text style={styles.sectionTitle}>
					{strings.color}
					{peeColor ? (
						<Text style={styles.selectedLabel}>
							{" "}
							· {PEE_COLOR_LABELS[peeColor]}
						</Text>
					) : null}
				</Text>
				<View style={styles.swatchGrid}>
					{PEE_COLORS.map((c) => (
						<TouchableOpacity key={c} onPress={() => setPeeColor(c)}>
							<Pop selected={peeColor === c}>
								<View
									style={[
										styles.swatch,
										{ backgroundColor: PEE_COLOR_HEX[c] },
										peeColor === c && styles.optionSelected,
									]}>
									{peeColor === c ? (
										<Ionicons name="checkmark" size={24} color="#5C4A32" />
									) : null}
								</View>
							</Pop>
						</TouchableOpacity>
					))}
				</View>

				<Text style={styles.sectionTitle}>{strings.foam}</Text>
				<View style={styles.optionRow}>
					{PEE_FOAMS.map((f) => (
						<FoamOption
							key={f}
							value={f}
							selected={peeFoam === f}
							onPress={() => setPeeFoam(f)}
						/>
					))}
				</View>

				<Text style={styles.sectionTitle}>量</Text>
				<View style={styles.optionRow}>
					{PEE_VOLUMES.map((v) => (
						<VolumeCup
							key={v}
							value={v}
							selected={peeVolume === v}
							onPress={() => setPeeVolume(v)}
						/>
					))}
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
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.md,
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
	titleIcon: { width: 30, height: 34 },
	mascot: { width: 52, height: 58 },
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
	swatchGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		gap: 12,
	},
	swatch: {
		width: 48,
		height: 48,
		borderRadius: 24,
		borderWidth: 2,
		borderColor: "#00000018",
		alignItems: "center",
		justifyContent: "center",
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
	optionRow: {
		flexDirection: "row",
		justifyContent: "center",
		gap: 20,
	},
	optionWrap: { alignItems: "center", gap: 4 },
	foamCircle: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: "#FFF8ED",
		borderWidth: 2,
		borderColor: "#D9B98A",
		alignItems: "center",
		justifyContent: "center",
	},
	bubbleCluster: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		alignItems: "center",
		maxWidth: 42,
		gap: 3,
	},
	bubble: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: "#D6ECF6",
		borderWidth: 1,
		borderColor: "#8FC4DC",
	},
	bubbleBig: {
		width: 14,
		height: 14,
		borderRadius: 7,
	},
	optionLabel: {
		fontSize: 13,
		fontWeight: "700",
		color: theme.colors.text,
	},
	cup: {
		width: 56,
		height: 58,
		borderRadius: 12,
		backgroundColor: "#FFF8ED",
		borderWidth: 2,
		borderColor: "#D9B98A",
		overflow: "hidden",
		justifyContent: "flex-end",
	},
	cupFill: {
		backgroundColor: "#F5D04C",
		justifyContent: "flex-start",
		alignItems: "flex-end",
	},
	cupBubble: {
		width: 9,
		height: 9,
		borderRadius: 5,
		backgroundColor: "#FBE9A9",
		marginTop: 3,
		marginRight: 5,
	},
	photoBox: {
		borderWidth: 2,
		borderColor: "#B97F4E",
		borderStyle: "dashed",
		borderRadius: 18,
		paddingVertical: theme.spacing.sm,
		paddingHorizontal: theme.spacing.md,
		alignItems: "center",
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
	},
	submit: {
		backgroundColor: "#FF7B32",
		borderBottomColor: "#C85A27",
		borderBottomWidth: 6,
		borderRadius: 18,
		height: 56,
		alignItems: "center",
		justifyContent: "center",
	},
	submitDisabled: { opacity: 0.65 },
	submitText: {
		color: "#FFFFFF",
		fontSize: 22,
		fontWeight: "800",
	},
});
