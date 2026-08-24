import { useState } from "react";
import {
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
	SafeAreaView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from "react-native";
import { useAuth } from "../auth/AuthContext";
import { theme } from "../theme";
import { strings } from "../i18n";

type Mode = "signin" | "signup" | "forgot";

export default function AuthScreen() {
	const { signIn, signUp, signOut, resetPassword, updatePassword, recovering } =
		useAuth();
	const { height, width } = useWindowDimensions();
	const compact = height < 760;
	const heroHeight = Math.min(
		width / 1.019,
		compact ? height - 300 : height * 0.57,
	);
	const [mode, setMode] = useState<Mode>("signin");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [resetSent, setResetSent] = useState(false);

	const submit = async () => {
		if (!email || !password) {
			Alert.alert(strings.error, strings.pleaseTryAgain);
			return;
		}
		setSubmitting(true);
		try {
			if (mode === "signin") {
				await signIn(email.trim(), password);
			} else {
				await signUp(email.trim(), password);
				Alert.alert(strings.signUpSuccess);
				setMode("signin");
				setPassword("");
			}
		} catch (err) {
			Alert.alert(
				strings.error,
				err instanceof Error ? err.message : strings.pleaseTryAgain,
			);
		} finally {
			setSubmitting(false);
		}
	};

	const submitForgot = async () => {
		if (!email) {
			Alert.alert(strings.error, strings.pleaseTryAgain);
			return;
		}
		setSubmitting(true);
		try {
			await resetPassword(email.trim());
			setResetSent(true);
		} catch (err) {
			Alert.alert(
				strings.error,
				err instanceof Error ? err.message : strings.pleaseTryAgain,
			);
		} finally {
			setSubmitting(false);
		}
	};

	const submitNewPassword = async () => {
		if (!password || !confirmPassword) {
			Alert.alert(strings.error, strings.pleaseTryAgain);
			return;
		}
		if (password !== confirmPassword) {
			Alert.alert(strings.error, strings.passwordMismatch);
			return;
		}
		setSubmitting(true);
		try {
			await updatePassword(password);
			Alert.alert(strings.passwordUpdated);
			setPassword("");
			setConfirmPassword("");
			setMode("signin");
		} catch (err) {
			Alert.alert(
				strings.error,
				err instanceof Error ? err.message : strings.pleaseTryAgain,
			);
		} finally {
			setSubmitting(false);
		}
	};

	const goBackToSignIn = () => {
		setResetSent(false);
		setMode("signin");
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView
				style={styles.container}
				behavior={Platform.OS === "ios" ? "padding" : undefined}>
				<View style={styles.content}>
					<Image
						source={require("../../../api/src/assets/login-hero-section.png")}
						resizeMode="cover"
						style={{ width, height: heroHeight }}
					/>

					<View style={[styles.form, compact && styles.formCompact]}>
						{recovering ? (
							<>
								<Text style={[styles.title, compact && styles.titleCompact]}>
									{strings.newPasswordTitle}
								</Text>
								<Text style={[styles.hint, compact && styles.hintCompact]}>
									{strings.newPasswordHint}
								</Text>

								<View
									style={[
										styles.inputWrap,
										compact && styles.inputWrapCompact,
									]}>
									<Text style={styles.inputIcon}>🔑</Text>
									<TextInput
										style={styles.input}
										placeholder={strings.newPassword}
										placeholderTextColor={theme.colors.muted}
										value={password}
										onChangeText={setPassword}
										secureTextEntry
										autoComplete="new-password"
									/>
								</View>
								<View
									style={[
										styles.inputWrap,
										compact && styles.inputWrapCompact,
									]}>
									<Text style={styles.inputIcon}>🔑</Text>
									<TextInput
										style={styles.input}
										placeholder={strings.confirmPassword}
										placeholderTextColor={theme.colors.muted}
										value={confirmPassword}
										onChangeText={setConfirmPassword}
										secureTextEntry
										autoComplete="new-password"
									/>
								</View>

								<TouchableOpacity
									style={[
										styles.button,
										compact && styles.buttonCompact,
										submitting && styles.buttonDisabled,
									]}
									onPress={submitNewPassword}
									disabled={submitting}
									activeOpacity={0.82}>
									<Text style={styles.buttonText}>
										{submitting ? strings.loading : strings.saveNewPassword}
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={[
										styles.switchButton,
										compact && styles.switchButtonCompact,
									]}
									onPress={signOut}
									disabled={submitting}>
									<Text style={styles.switchText}>{strings.cancel}</Text>
								</TouchableOpacity>
							</>
						) : mode === "forgot" ? (
							<>
								<Text style={[styles.title, compact && styles.titleCompact]}>
									{strings.forgotPasswordTitle}
								</Text>

								{resetSent ? (
									<Text
										style={[styles.successText, compact && styles.hintCompact]}>
										{strings.resetLinkSent}
									</Text>
								) : (
									<>
										<Text style={[styles.hint, compact && styles.hintCompact]}>
											{strings.forgotPasswordHint}
										</Text>
										<View
											style={[
												styles.inputWrap,
												compact && styles.inputWrapCompact,
											]}>
											<Text style={styles.inputIcon}>✉</Text>
											<TextInput
												style={styles.input}
												placeholder={strings.email}
												placeholderTextColor={theme.colors.muted}
												value={email}
												onChangeText={setEmail}
												autoCapitalize="none"
												keyboardType="email-address"
												autoComplete="email"
											/>
										</View>
									</>
								)}

								<TouchableOpacity
									style={[
										styles.button,
										compact && styles.buttonCompact,
										submitting && styles.buttonDisabled,
									]}
									onPress={resetSent ? goBackToSignIn : submitForgot}
									disabled={submitting}
									activeOpacity={0.82}>
									<Text style={styles.buttonText}>
										{submitting
											? strings.loading
											: resetSent
												? strings.backToSignIn
												: strings.sendResetLink}
									</Text>
								</TouchableOpacity>

								{!resetSent && (
									<TouchableOpacity
										style={[
											styles.switchButton,
											compact && styles.switchButtonCompact,
										]}
										onPress={goBackToSignIn}
										disabled={submitting}>
										<Text style={styles.switchText}>
											{strings.backToSignIn}
										</Text>
									</TouchableOpacity>
								)}
							</>
						) : (
							<>
								<View
									style={[
										styles.inputWrap,
										compact && styles.inputWrapCompact,
									]}>
									<Text style={styles.inputIcon}>✉</Text>
									<TextInput
										style={styles.input}
										placeholder={strings.email}
										placeholderTextColor={theme.colors.muted}
										value={email}
										onChangeText={setEmail}
										autoCapitalize="none"
										keyboardType="email-address"
										autoComplete="email"
									/>
								</View>
								<View
									style={[
										styles.inputWrap,
										compact && styles.inputWrapCompact,
									]}>
									<Text style={styles.inputIcon}>🔑</Text>
									<TextInput
										style={styles.input}
										placeholder={strings.password}
										placeholderTextColor={theme.colors.muted}
										value={password}
										onChangeText={setPassword}
										secureTextEntry
										autoComplete="password"
									/>
								</View>

								<TouchableOpacity
									style={[
										styles.button,
										compact && styles.buttonCompact,
										submitting && styles.buttonDisabled,
									]}
									onPress={submit}
									disabled={submitting}
									activeOpacity={0.82}>
									<Text style={styles.buttonText}>
										{submitting
											? strings.loading
											: mode === "signin"
												? strings.signIn
												: strings.signUp}
									</Text>
								</TouchableOpacity>

								{mode === "signin" && (
									<TouchableOpacity onPress={() => setMode("forgot")}>
										<Text
											style={[
												styles.forgotText,
												compact && styles.compactText,
											]}>
											{strings.forgotPassword}
										</Text>
									</TouchableOpacity>
								)}

								<TouchableOpacity
									style={[
										styles.switchButton,
										compact && styles.switchButtonCompact,
									]}
									onPress={() =>
										setMode(mode === "signin" ? "signup" : "signin")
									}>
									<Text style={styles.switchText}>
										{mode === "signin" ? "新用戶註冊" : "已有帳戶？登入"}
									</Text>
								</TouchableOpacity>
							</>
						)}
					</View>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: theme.colors.background },
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		justifyContent: "space-between",
	},
	form: {
		paddingHorizontal: "17%",
		paddingBottom: 10,
	},
	formCompact: { paddingBottom: 4 },
	title: {
		color: theme.colors.text,
		fontSize: 24,
		fontWeight: "800",
		marginBottom: 8,
		textAlign: "center",
	},
	titleCompact: { fontSize: 20, marginBottom: 4 },
	hint: {
		color: "#A85F45",
		fontSize: 15,
		lineHeight: 21,
		marginBottom: 16,
		textAlign: "center",
	},
	hintCompact: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
	successText: {
		color: theme.colors.success,
		fontSize: 16,
		fontWeight: "700",
		lineHeight: 22,
		marginBottom: 16,
		textAlign: "center",
	},
	inputWrap: {
		alignItems: "center",
		backgroundColor: "#FFF8ED",
		borderColor: "#D9825C",
		borderRadius: theme.radius.pill,
		borderWidth: 2,
		flexDirection: "row",
		height: 58,
		marginBottom: 14,
		paddingHorizontal: 17,
	},
	inputWrapCompact: { height: 49, marginBottom: 10 },
	inputIcon: {
		color: "#BC6847",
		fontSize: 23,
		marginRight: 11,
		width: 28,
	},
	input: {
		color: theme.colors.text,
		flex: 1,
		fontSize: 17,
		fontWeight: "700",
		paddingVertical: 10,
	},
	button: {
		backgroundColor: "#FF7B32",
		borderBottomColor: "#C85A27",
		borderBottomWidth: 6,
		borderRadius: theme.radius.lg,
		alignItems: "center",
		height: 68,
		justifyContent: "center",
	},
	buttonCompact: { height: 56 },
	buttonDisabled: { opacity: 0.65 },
	buttonText: { color: "#FFFFFF", fontSize: 24, fontWeight: "800" },
	forgotText: {
		color: "#A85F45",
		fontSize: 16,
		fontWeight: "700",
		marginTop: 16,
		textAlign: "center",
	},
	compactText: { marginTop: 10 },
	switchButton: { alignSelf: "center", marginTop: 16 },
	switchButtonCompact: { marginTop: 10 },
	switchText: {
		backgroundColor: "#fcebd3",
		borderColor: "#D9825C",
		borderRadius: theme.radius.pill,
		borderWidth: 2,
		color: "#A85F45",
		fontSize: 16,
		textAlign: "center",
		fontWeight: "700",
		paddingHorizontal: 22,
		paddingVertical: 9,
	},
});
