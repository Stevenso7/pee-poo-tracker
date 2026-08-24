import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../theme';
import { strings } from '../i18n';
import { api } from '../services/api';
import type { Screen } from '../../App';

type Props = { navigate: (s: Screen) => void };

export default function HomeScreen({ navigate }: Props) {
  const [today, setToday] = useState({ pee: 0, poo: 0 });

  useEffect(() => {
    api
      .getSummary()
      .then((s) => {
        const todayStr = new Date().toISOString().slice(0, 10);
        const day = s.daily.find((d) => d.date === todayStr);
        setToday({ pee: day?.peeCount ?? 0, poo: day?.pooCount ?? 0 });
      })
      .catch(() => undefined);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{strings.appName}</Text>
      <Text style={styles.subtitle}>{strings.homeGreeting}</Text>

      <View style={styles.countRow}>
        <Text style={styles.count}>
          💧 {strings.todayPee} {today.pee} {strings.times}
        </Text>
        <Text style={styles.count}>
          💩 {strings.todayPoo} {today.poo} {strings.times}
        </Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.pee }]}
          onPress={() => navigate({ name: 'log', type: 'PEE' })}
        >
          <Text style={styles.buttonText}>💧 {strings.pee}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.poo }]}
          onPress={() => navigate({ name: 'log', type: 'POO' })}
        >
          <Text style={styles.buttonText}>💩 {strings.poo}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.link}
          onPress={() => navigate({ name: 'history' })}
        >
          <Text style={styles.linkText}>📖 {strings.log}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.link}
          onPress={() => navigate({ name: 'settings' })}
        >
          <Text style={styles.linkText}>⚙️ {strings.settings}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  title: { fontSize: 36, fontWeight: 'bold', color: theme.colors.text },
  subtitle: {
    fontSize: 16,
    color: theme.colors.muted,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  countRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  count: { fontSize: 16, color: theme.colors.text, fontWeight: '600' },
  buttons: { width: '100%', gap: theme.spacing.md },
  button: {
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  buttonText: { fontSize: 20, fontWeight: '600', color: theme.colors.text },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  link: { padding: theme.spacing.sm },
  linkText: { fontSize: 16, color: theme.colors.primary, fontWeight: '600' },
});
