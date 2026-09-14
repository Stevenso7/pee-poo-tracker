import { useEffect, useState, useMemo } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RECORD_TYPE_LABELS } from '@pee-poo/shared';
import { theme } from '../theme';
import { strings } from '../i18n';
import { api, type AnalysisItem, type BatchAnalysisItem, ApiError } from '../services/api';
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
  const [batchAnalyses, setBatchAnalyses] = useState<BatchAnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Batch analysis modal state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchType, setBatchType] = useState<'PEE' | 'POO'>('POO');
  const [batchDays, setBatchDays] = useState(5);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);

  const loadAnalyses = async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const [res, batchRes] = await Promise.all([
        api.getAnalyses({ limit: 20, offset: isLoadMore ? offset : 0 }),
        api.getBatchAnalyses({ limit: 20, offset: isLoadMore ? offset : 0 }),
      ]);
      if (isLoadMore) {
        setAnalyses((prev) => [...prev, ...res.analyses]);
        setBatchAnalyses((prev) => [...prev, ...batchRes.batchAnalyses]);
      } else {
        setAnalyses(res.analyses);
        setBatchAnalyses(batchRes.batchAnalyses);
      }
      setOffset((prev) => prev + res.analyses.length);
      setHasMore(res.hasMore || batchRes.hasMore);
    } catch (err) {
      console.error('Failed to load analyses:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleBatchAnalyze = async () => {
    setBatchAnalyzing(true);
    try {
      const res = await api.batchAnalyze({
        type: batchType,
        days: batchDays,
        force: false,
      });
      setShowBatchModal(false);
      Alert.alert(
        strings.batchAnalyzeSuccess,
        strings.batchAnalyzeSuccess.replace('{count}', String(res.totalCount)),
      );
      loadAnalyses(false); // Refresh the list
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          Alert.alert(strings.batchAnalyzeQuotaExhausted);
        } else if (err.status === 400) {
          Alert.alert(strings.batchAnalyzeNoRecords.replace('{type}', batchType === 'PEE' ? strings.pee : strings.poo));
        } else {
          Alert.alert(strings.error, err.message);
        }
      } else {
        Alert.alert(strings.error, strings.analysisFailed);
      }
    } finally {
      setBatchAnalyzing(false);
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
          <Text style={styles.summaryText} numberOfLines={1}>
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

  const renderBatchItem = ({ item }: { item: BatchAnalysisItem }) => {
    const completedAt = new Date(item.completedAt ?? item.createdAt);
    const typeLabel = item.type === 'PEE' ? strings.peeType : strings.pooType;
    const typeEmoji = item.type === 'PEE' ? '💧' : '💩';

    return (
      <TouchableOpacity
        style={[styles.card, styles.batchCard]}
        activeOpacity={0.8}
        onPress={() => navigate({ name: 'batchDetail', id: item.id })}>
        <View style={styles.batchIconWrapper}>
          <Image
            source={
              item.type === 'PEE'
                ? require('../../../api/src/assets/record_pee.png')
                : require('../../../api/src/assets/record_poo.png')
            }
            resizeMode="contain"
            style={styles.batchIcon}
          />
          <View style={styles.batchBadge}>
            <Text style={styles.batchBadgeText}>{item.recordCount}</Text>
          </View>
        </View>
        <View style={styles.batchMainContent}>
          <View style={styles.batchTopRow}>
            <Text style={styles.batchDateTime}>
              {dayLabel(completedAt)} {timeLabel(completedAt)}
            </Text>
            <View style={styles.batchTypeBadge}>
              <Text style={styles.batchTypeBadgeText}>
                {typeEmoji} {typeLabel} · {item.days}天
              </Text>
            </View>
          </View>
          <View style={styles.batchBottomRow}>
            <Text style={styles.batchSummaryText} numberOfLines={2}>
              {item.reportText ?? '分析中...'}
            </Text>
            <View style={styles.batchMetaRow}>
              <Text style={styles.batchMetaText}>
                {item.recordCount} 筆 · 1額度
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Combine and sort analyses by date (newest first)
  const combinedItems = useMemo(() => {
    const items = [
      ...analyses.map(a => ({ ...a, _type: 'single' as const, _sortDate: new Date(a.completedAt ?? a.createdAt).getTime() })),
      ...batchAnalyses.map(b => ({ ...b, _type: 'batch' as const, _sortDate: new Date(b.completedAt ?? b.createdAt).getTime() })),
    ];
    return items.sort((a, b) => b._sortDate - a._sortDate);
  }, [analyses, batchAnalyses]);

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
        <TouchableOpacity style={styles.batchButton} onPress={() => setShowBatchModal(true)}>
          <Ionicons name="analytics" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.loadingText}>載入分析記錄中...</Text>
        </View>
      ) : combinedItems.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>暫無 AI 分析記錄</Text>
          <Text style={styles.emptyHint}>去分析幾筆記錄試試啦 💧💩</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={combinedItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => item._type === 'batch' ? renderBatchItem({ item }) : renderItem({ item })}
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

      {/* Batch Analysis Modal */}
      <Modal visible={showBatchModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay} onTouchStart={() => setShowBatchModal(false)}>
          <View style={styles.modalContent} onTouchStart={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{strings.batchAnalyzeTitle}</Text>
              <TouchableOpacity onPress={() => setShowBatchModal(false)}>
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{strings.selectType}</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      batchType === 'PEE' && styles.typeOptionActive,
                    ]}
                    onPress={() => setBatchType('PEE')}>
                    <Text style={[
                      styles.typeOptionText,
                      batchType === 'PEE' && styles.typeOptionTextActive,
                    ]}>
                      {strings.peeType}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      batchType === 'POO' && styles.typeOptionActive,
                    ]}
                    onPress={() => setBatchType('POO')}>
                    <Text style={[
                      styles.typeOptionText,
                      batchType === 'POO' && styles.typeOptionTextActive,
                    ]}>
                      {strings.pooType}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{strings.selectDays}</Text>
                <View style={styles.daysSelector}>
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.dayOption,
                        batchDays === d && styles.dayOptionActive,
                      ]}
                      onPress={() => setBatchDays(d)}>
                      <Text style={[
                        styles.dayOptionText,
                        batchDays === d && styles.dayOptionTextActive,
                      ]}>
                        {d} {strings.daysLabel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoText}>
                  會一次過分析過去 {batchDays} 天嘅所有 {batchType === 'PEE' ? strings.peeType : strings.pooType} 記錄，
                  只扣 1 次免費額度 💡
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.modalActionButton,
                batchAnalyzing && styles.modalActionButtonDisabled,
              ]}
              onPress={handleBatchAnalyze}
              disabled={batchAnalyzing}>
              <Text style={styles.modalActionButtonText}>
                {batchAnalyzing ? strings.batchAnalyzing : strings.startBatchAnalyze}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  batchButton: { padding: theme.spacing.xs },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.lg,
    maxHeight: '85%',
  },
  modalBody: {
    marginBottom: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  modalSection: {
    marginBottom: theme.spacing.lg,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  typeOption: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  typeOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF4EB',
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  typeOptionTextActive: {
    color: theme.colors.primary,
  },
  daysSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  dayOption: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  dayOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF4EB',
  },
  dayOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  dayOptionTextActive: {
    color: theme.colors.primary,
  },
  modalInfo: {
    backgroundColor: '#FFF8ED',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  modalInfoText: {
    fontSize: 13,
    color: '#A85F45',
    lineHeight: 20,
  },
  modalActionButton: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  modalActionButtonDisabled: {
    opacity: 0.6,
  },
  modalActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  batchCard: {
    backgroundColor: '#FFF8F2',
    borderWidth: 1,
    borderColor: '#F2D9B8',
    paddingVertical: theme.spacing.sm,
  },
  batchIconWrapper: {
    position: 'relative',
    width: 56,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchIcon: {
    width: 48,
    height: 56,
  },
  batchBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  batchBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  batchMainContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
    paddingRight: theme.spacing.sm,
    justifyContent: 'center',
  },
  batchTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  batchDateTime: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  batchTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  batchTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  batchBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  batchSummaryText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 19,
  },
  batchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  batchMetaText: {
    fontSize: 11,
    color: theme.colors.muted,
    fontWeight: '600',
  },
});