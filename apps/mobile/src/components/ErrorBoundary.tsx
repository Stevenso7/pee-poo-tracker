import { Component, type ErrorInfo, type ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../theme";

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
	state: State = { error: null };

	static getDerivedStateFromError(error: Error): State {
		return { error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("ErrorBoundary caught:", error, info.componentStack);
	}

	handleRetry = () => {
		this.setState({ error: null });
	};

	render() {
		if (this.state.error) {
			return (
				<View style={styles.wrap}>
					<Text style={styles.emoji}>🚽💥</Text>
					<Text style={styles.title}>哎呀，出事啦！</Text>
					<Text style={styles.detail}>
						個 app 剛才跌低咗，撳下面個掣就起身㗎喇 ✨
					</Text>
					<TouchableOpacity style={styles.button} onPress={this.handleRetry} activeOpacity={0.82}>
						<Text style={styles.buttonText}>重試</Text>
					</TouchableOpacity>
				</View>
			);
		}
		return this.props.children;
	}
}

const styles = StyleSheet.create({
	wrap: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.background,
		padding: theme.spacing.xl,
		gap: theme.spacing.md,
	},
	emoji: { fontSize: 56 },
	title: {
		fontSize: 24,
		fontWeight: "800",
		color: theme.colors.text,
	},
	detail: {
		fontSize: 15,
		color: theme.colors.muted,
		textAlign: "center",
		lineHeight: 24,
	},
	button: {
		marginTop: theme.spacing.md,
		backgroundColor: theme.colors.primary,
		borderBottomColor: "#C85A27",
		borderBottomWidth: 6,
		borderRadius: theme.radius.pill,
		paddingVertical: theme.spacing.md,
		paddingHorizontal: theme.spacing.xl,
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 20,
		fontWeight: "800",
	},
});
