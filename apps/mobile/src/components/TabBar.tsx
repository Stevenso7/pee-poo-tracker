import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { strings } from '../i18n';

export type Tab = 'log' | 'settings';

type Props = { active?: Tab; onTab: (tab: Tab) => void };

export function TabBar({ active, onTab }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + theme.spacing.sm }]}>
      <TouchableOpacity style={styles.tab} onPress={() => onTab('log')}>
        <Image
          source={require('../../../api/src/assets/record_icon.png')}
          resizeMode="contain"
          style={styles.tabIcon}
        />
        <Text style={[styles.label, active === 'log' && styles.labelActive]}>
          {strings.log}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab} onPress={() => onTab('settings')}>
        <Ionicons
          name={active === 'settings' ? 'settings' : 'settings-outline'}
          size={30}
          color={theme.colors.primary}
        />
        <Text style={[styles.label, active === 'settings' && styles.labelActive]}>
          {strings.settings}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: "#fcebd3",
    borderTopWidth: 1.5,
    borderTopColor: "#E9D8C8",
    paddingTop: theme.spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  tabIcon: { width: 30, height: 30 },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  labelActive: {
    color: theme.colors.primary,
  },
});
