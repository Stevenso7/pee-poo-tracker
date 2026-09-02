import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RECORD_TYPE_LABELS } from '@pee-poo/shared';
import { theme } from '../theme';
import { strings } from '../i18n';
import { api, type AnalysisItem } from '../services/api';
import { TabBar } from '../components/TabBar';
import type { Screen } from '../../App';

function dayLabel(d: Date) {
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(new Date()) - startOfDay(d)) / 86_400_000,
  );
  if (diffDays === 0) return strings.today;
  if (diffDays === 1) return strings.yesterday;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function timeLabel(d: Date) {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function AIHistoryScreen({
  navigate,
}: {
  navigate: (s: Screen) => void;
}) {
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadAnalyses = async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await api.getAnalyses({ limit: 20, offset: isLoadMore ? offset : 0 });
      if (isLoadMore) {
        setAnalyses((prev) => [...prev, ...res.analyses]);
      } else {
        setAnalyses(res.analyses);
      }
      setOffset((prev) => prev + res.analyses.length);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error('Failed to load analyses:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadAnalyses(false);
  }, []);

  const renderItem = ({ item }: { item: AnalysisItem }) => {
    const recordedAt = new Date(item.record?.recordedAt ?? item.completedAt ?? Date.now());
    const recordId = item.record?.id ?? item.recordId;
    const isValidUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          recordId && isValidUuid(recordId)
            ? navigate({ name: 'detail', id: recordId })
            : console.warn('Invalid record ID for navigation:', recordId)
        }>
        <Image
          source={
            item.record?.type === 'PEE'
              ? require('../../../api/src/assets/record_pee.png')
              : require('../../../api/src/assets/record_poo.png')
          }
          resizeMode="contain"
          style={styles.icon}
        />
        <View style={styles.info}>
          <Text style={styles.datetime}>
            {dayLabel(recordedAt)} {timeLabel(recordedAt)}
          </Text>
          <Text style={styles.type}>
            {item.record?.type ? RECORD_TYPE_LABELS[item.record.type] : ''}
          </Text>
        </View>
        <View style={styles.summary}>
          <Text style={styles.summaryText} numberOfLines={2}>
            {item.reportText ?? '分析中...'}
          </Text>
        </View>
        <View style={styles.badges}>
          {item.record?.photoStoragePath ? (
            <View style={[styles.badge, styles.badgePhoto]}>
              <Ionicons name="camera" size={14} color="#5C4A32" />
              <Text style={styles.badgeText}>{strings.photo}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigate({ name: 'home' })}>
          <Ionicons name="chevron-back" size={30} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Ionicons name="sparkles" size={30} color={theme.colors.primary} />
          <Text style={styles.title}>AI 分析記錄</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.loadingText}>載入分析記錄中...</Text>
        </View>
      ) : analyses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>暫無 AI 分析記錄</Text>
          <Text style={styles.emptyHint}>去分析幾筆記錄試試啦 💧💩</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={analyses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onEndReached={() => {
            if (hasMore && !loadingMore) loadAnalyses(true);
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadMore}>
                <ActivityIndicator color={theme.colors.primary} size="small" />
              </View>
            ) : null
          }
        />
      )}

      <TabBar
        active="aiHistory"
        onTab={(tab) => navigate({ name: tab === 'log' ? 'history' : tab === 'aiHistory' ? 'aiHistory' : 'settings' })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  backButton: { padding: theme.spacing.xs },
  headerSpacer: { width: 38 },
  titleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.text,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    color: theme.colors.muted,
    fontSize: 16,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  emptyHint: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  list: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.md,
    paddingBottom: 140,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    shadowColor: '#C85A27',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  icon: { width: 56, height: 64 },
  info: { flex: 1, gap: 2 },
  datetime: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  type: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  summary: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  summaryText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'flex-end',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: theme.radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  badgePhoto: { backgroundColor: '#D9B98A' },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5C4A32',
  },
  loadMore: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
});