import { useEffect, useState } from 'react';
import {
	Alert,
	Modal,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { strings } from '../i18n';
import { api, type SettingsView } from '../services/api';
import {
	requestNotificationPermission,
	scheduleDailyReminders,
	cancelAllReminders,
} from '../services/notifications';
import { TabBar } from '../components/TabBar';
import type { Screen } from '../../App';

const RETENTION_OPTIONS = [7, 14, 30, 60, 90];

export default function SettingsScreen({
	navigate,
}: {
	navigate: (s: Screen) => void;
}) {
	const { signOut } = useAuth();
	const [settings, setSettings] = useState<SettingsView | null>(null);
	const [showRetentionModal, setShowRetentionModal] = useState(false);

	useEffect(() => {
		api
			.getSettings()
			.then(setSettings)
			.catch(() => undefined);
	}, []);

	const toggleReminders = async (value: boolean) => {
		try {
			if (value) {
				const ok = await requestNotificationPermission();
				if (!ok) {
					Alert.alert(strings.error, '要通知權限先得呀');
					return;
				}
				const times = settings?.reminderTimes?.length
					? settings.reminderTimes
					: ['21:00'];
				await scheduleDailyReminders(times);
			} else {
				await cancelAllReminders();
			}
			const updated = await api.updateSettings({ reminderEnabled: value });
			setSettings(updated);
		} catch (err) {
			Alert.alert(
				strings.error,
				err instanceof Error ? err.message : strings.pleaseTryAgain,
			);
		}
	};

	const setRetention = async (days: number) => {
		try {
			const updated = await api.updateSettings({ photoRetentionDays: days });
			setSettings(updated);
			setShowRetentionModal(false);
			Alert.alert(strings.saved);
		} catch (err) {
			Alert.alert(
				strings.error,
				err instanceof Error ? err.message : strings.pleaseTryAgain,
			);
		}
	};

	const doSignOut = () => {
		Alert.alert(strings.signOut, '確定登出？', [
			{ text: strings.cancel, style: 'cancel' },
			{ text: strings.signOut, style: 'destructive', onPress: () => signOut() },
		]);
	};

	return (
		<SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
			<ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
<View style={styles.header}>
			<TouchableOpacity
				style={styles.backButton}
				onPress={() => navigate({ name: "home" })}>
				<Ionicons name="chevron-back" size={30} color={theme.colors.text} />
			</TouchableOpacity>
			<View style={styles.titleWrap}>
				<Ionicons name="settings" size={30} color={theme.colors.primary} />
				<Text style={styles.title}>{strings.settings}</Text>
			</View>
			<View style={styles.headerSpacer} />
		</View>

				<View style={styles.card}>
					<View style={styles.row}>
						<Text style={styles.rowLabel}>{strings.settingsReminders}</Text>
						<Switch
							value={settings?.reminderEnabled ?? false}
							onValueChange={toggleReminders}
							trackColor={{ true: theme.colors.primary }}
							thumbColor={theme.colors.primary}
						/>
					</View>
					<Text style={styles.hint}>
						{settings?.reminderEnabled
							? strings.reminderOnHint
							: strings.reminderOffHint}
					</Text>
					{settings?.reminderTimes && settings.reminderTimes.length > 0 && (
						<Text style={styles.hint}>
							{strings.settingsReminderTimes}: {settings.reminderTimes.join('、')}
						</Text>
					)}
				</View>

				<View style={styles.card}>
					<Text style={styles.rowLabel}>{strings.settingsPhotoRetention}</Text>
					<TouchableOpacity
						style={styles.dropdown}
						onPress={() => setShowRetentionModal(true)}>
						<View style={styles.dropdownInner}>
							<Text style={styles.dropdownText}>
								{settings?.photoRetentionDays ?? 30} {strings.days}
							</Text>
							<Ionicons name="chevron-down" size={22} color={theme.colors.muted} />
						</View>
					</TouchableOpacity>
				</View>

				<View style={styles.card}>
					<Text style={styles.rowLabel}>計劃</Text>
					<View
						style={[
							styles.planCard,
							{
								backgroundColor:
									settings?.plan === 'PREMIUM' ? '#FFF4E0' : '#FFF8ED',
								borderColor:
									settings?.plan === 'PREMIUM' ? '#F2994A' : '#D9B98A',
							},
						]}>
						<View style={styles.planBadge}>
							<Ionicons
								name={settings?.plan === 'PREMIUM' ? 'diamond' : 'ellipse-outline'}
								size={28}
								color={theme.colors.primary}
							/>
						</View>
						<View style={styles.planInfo}>
							<Text style={styles.planName}>
								{settings?.plan === 'PREMIUM' ? '高級版' : '免費版'}
							</Text>
							<Text style={styles.planDetail}>
								{strings.quotaRemaining.replace(
									'{n}',
									String(settings?.analysisQuota.remaining ?? 0),
								)}
							</Text>
						</View>
						</View>
				</View>

				<View style={styles.card}>
					<Text style={styles.rowLabel}>帳戶</Text>
					<TouchableOpacity style={styles.signOutButton} onPress={doSignOut}>
						<Ionicons name="log-out" size={22} color={theme.colors.danger} />
						<Text style={styles.signOutText}>{strings.signOut}</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.bottomSpacer} />
			</ScrollView>

			<Modal visible={showRetentionModal} animationType="slide" transparent>
				<View style={styles.modalOverlay} onTouchStart={() => setShowRetentionModal(false)} />
				<View style={styles.modalContent}>
					<View style={styles.modalHeader}>
						<Text style={styles.modalTitle}>{strings.settingsPhotoRetention}</Text>
						<TouchableOpacity
							onPress={() => setShowRetentionModal(false)}>
							<Ionicons name="close" size={28} color={theme.colors.muted} />
						</TouchableOpacity>
					</View>
					<View style={styles.modalOptions}>
						{RETENTION_OPTIONS.map((d) => (
							<TouchableOpacity
								key={d}
								style={[
									styles.modalOption,
									settings?.photoRetentionDays === d && styles.modalOptionSelected,
								]}
								onPress={() => setRetention(d)}>
								<Text
									style={[
										styles.modalOptionText,
										settings?.photoRetentionDays === d && styles.modalOptionTextSelected,
									]}>
									{d} {strings.days}
								</Text>
								{settings?.photoRetentionDays === d && (
									<Ionicons name="checkmark" size={24} color={theme.colors.primary} />
								)}
							</TouchableOpacity>
						))}
					</View>
				</View>
			</Modal>

			<TabBar
				active="settings"
				onTab={(tab) =>
					navigate({
						name: tab === 'log' ? 'history' : tab === 'aiHistory' ? 'aiHistory' : 'settings',
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
	scrollContent: {
		flexGrow: 1,
		paddingHorizontal: theme.spacing.lg,
		paddingTop: theme.spacing.md,
		paddingBottom: 120,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: theme.spacing.md,
		marginBottom: theme.spacing.lg,
	},
	titleWrap: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
	},
	title: {
		fontSize: 32,
		fontWeight: '800',
		color: theme.colors.text,
	},
	backButton: { padding: theme.spacing.xs },
	headerSpacer: { width: 38 },
	card: {
		backgroundColor: theme.colors.surface,
		borderRadius: 24,
		padding: theme.spacing.lg,
		marginBottom: theme.spacing.md,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	rowLabel: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
	hint: { color: theme.colors.muted, marginTop: 6, fontSize: 14 },
	dropdown: {
		marginTop: theme.spacing.sm,
	},
	dropdownInner: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#FFF8ED',
		borderWidth: 2,
		borderColor: '#D9B98A',
		borderRadius: theme.radius.pill,
		paddingVertical: theme.spacing.sm,
		paddingHorizontal: theme.spacing.md,
	},
	dropdownText: {
		fontSize: 16,
		fontWeight: '600',
		color: theme.colors.text,
	},
	planCard: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: theme.spacing.md,
		marginTop: theme.spacing.sm,
		padding: theme.spacing.md,
		borderRadius: 16,
		borderWidth: 1,
	},
	planBadge: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: theme.colors.primary,
		alignItems: 'center',
		justifyContent: 'center',
	},
	planInfo: { flex: 1 },
	planName: {
		fontSize: 18,
		fontWeight: '800',
		color: theme.colors.text,
	},
	planDetail: {
		marginTop: 2,
		fontSize: 14,
		color: theme.colors.muted,
	},
	signOutButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		marginTop: theme.spacing.sm,
		paddingVertical: theme.spacing.sm,
		borderRadius: 12,
		backgroundColor: '#FFF0F0',
		borderWidth: 1,
		borderColor: '#F5C6CB',
	},
	signOutText: { color: theme.colors.danger, fontSize: 16, fontWeight: '700' },
	bottomSpacer: { height: 20 },
	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
	modalContent: {
		margin: theme.spacing.lg,
		backgroundColor: theme.colors.surface,
		borderRadius: 24,
		padding: theme.spacing.lg,
		maxHeight: 400,
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: theme.spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
		paddingBottom: theme.spacing.md,
	},
	modalTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
	modalOptions: { gap: 8 },
	modalOption: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: theme.spacing.md,
		paddingHorizontal: theme.spacing.md,
		borderRadius: 12,
		backgroundColor: '#FFF8ED',
	},
	modalOptionSelected: {
		backgroundColor: theme.colors.primary,
	},
	modalOptionText: {
		fontSize: 17,
		fontWeight: '600',
		color: theme.colors.text,
	},
	modalOptionTextSelected: { color: '#FFFFFF' },
});