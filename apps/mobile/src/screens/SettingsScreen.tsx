import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { strings } from '../i18n';
import { api, type SettingsView } from '../services/api';
import {
  requestNotificationPermission,
  scheduleDailyReminders,
  cancelAllReminders,
} from '../services/notifications';
import type { Screen } from '../../App';

const RETENTION_OPTIONS = [7, 14, 30, 60, 90];

export default function SettingsScreen({
  navigate,
}: {
  navigate: (s: Screen) => void;
}) {
  const { signOut } = useAuth();
  const [settings, setSettings] = useState<SettingsView | null>(null);

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
        const times =
          settings?.reminderTimes?.length > 0
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>⚙️ {strings.settings}</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{strings.settingsReminders}</Text>
          <Switch
            value={settings?.reminderEnabled ?? false}
            onValueChange={toggleReminders}
            trackColor={{ true: theme.colors.primary }}
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
        <View style={styles.retentionRow}>
          {RETENTION_OPTIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.retentionOption,
                settings?.photoRetentionDays === d && styles.retentionSelected,
              ]}
              onPress={() => setRetention(d)}
            >
              <Text
                style={[
                  styles.retentionText,
                  settings?.photoRetentionDays === d &&
                    styles.retentionTextSelected,
                ]}
              >
                {d} {strings.days}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.rowLabel}>計劃</Text>
        <Text style={styles.hint}>
          {settings?.plan === 'FREE' ? '免費' : '高級'}
          {' · '}
          {strings.quotaRemaining.replace(
            '{n}',
            String(settings?.analysisQuota.remaining ?? 0),
          )}
        </Text>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={doSignOut}>
        <Text style={styles.signOutText}>{strings.signOut}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.back}
        onPress={() => navigate({ name: 'home' })}
      >
        <Text style={styles.backText}>{strings.back}</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  hint: { color: theme.colors.muted, marginTop: theme.spacing.sm },
  retentionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  retentionOption: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  retentionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  retentionText: { color: theme.colors.text },
  retentionTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  signOutButton: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.danger,
    alignItems: 'center',
  },
  signOutText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  back: { marginTop: theme.spacing.lg, alignItems: 'center', padding: theme.spacing.sm },
  backText: { color: theme.colors.primary, fontSize: 16, fontWeight: '600' },
});
