import { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RECORD_TYPE_LABELS } from '@pee-poo/shared';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { strings } from '../i18n';
import { api, type RecordItem } from '../services/api';
import type { Screen } from '../../App';

export default function HistoryScreen({
  navigate,
}: {
  navigate: (s: Screen) => void;
}) {
  const [items, setItems] = useState<RecordItem[]>([]);

  useEffect(() => {
    api
      .listRecords()
      .then((res) => setItems(res.items))
      .catch(() => undefined);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>📖 {strings.log}</Text>

      {items.length === 0 ? (
        <Text style={styles.empty}>{strings.empty}</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigate({ name: 'detail', id: item.id })}
            >
              <Text style={styles.emoji}>
                {item.type === 'PEE' ? '💧' : '💩'}
              </Text>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>
                  {RECORD_TYPE_LABELS[item.type]}
                </Text>
                <Text style={styles.rowMeta}>
                  {new Date(item.recordedAt).toLocaleString('zh-HK')}
                </Text>
              </View>
              {item.photoStoragePath ? <Text>📷</Text> : null}
              {item.analysis?.status === 'COMPLETED' ? (
                <Text>✨</Text>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.back}
        onPress={() => navigate({ name: 'home' })}
      >
        <Text style={styles.backText}>{strings.back}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  empty: {
    color: theme.colors.muted,
    fontSize: 16,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  emoji: { fontSize: 28 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  rowMeta: { fontSize: 13, color: theme.colors.muted },
  back: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  backText: { color: theme.colors.primary, fontSize: 16, fontWeight: '600' },
});
