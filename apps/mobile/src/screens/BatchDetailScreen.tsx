import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
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
import { api, type BatchAnalysisItem, ApiError } from '../services/api';
import { TabBar } from '../components/TabBar';
import type { Screen } from '../../App';

const CONFIDENCE_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function List({
  title,
  items,
  danger,
}: {
  title: string;
  items: string[];
  danger?: boolean;
}) {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.listBlock}>
      <Text style={[styles.listTitle, danger && styles.dangerText]}>{title}</Text>
      {items.map((item, i) => (
        <Text key={i} style={[styles.listItem, danger && styles.dangerText]}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.listBlock}>
      <Text style={styles.listTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BatchReportView({ report }: { report: BatchAnalysisItem['reportJson'] }) {
  if (!report) return <Text style={styles.meta}>分析中...</Text>;

  return (
    <View>
      <Text style={styles.summary}>{report.summary}</Text>

      <Section title={strings.observations}>
        {report.observations?.colorPatterns ? (
          <Field label={strings.color} value={report.observations.colorPatterns} />
        ) : null}
        {report.observations?.consistencyPatterns ? (
          <Field label={strings.consistency} value={report.observations.consistencyPatterns} />
        ) : null}
        {report.observations?.frequency ? (
          <Field label={strings.consistency} value={report.observations.frequency} />
        ) : null}
      </Section>

      {report.possibleInterpretations?.length > 0 && (
        <List
          title={strings.possibleInterpretations}
          items={report.possibleInterpretations}
        />
      )}
      {report.lifestyleHints?.length > 0 && (
        <List title={strings.lifestyleHints} items={report.lifestyleHints} />
      )}
      {report.redFlags?.length > 0 && (
        <List title={strings.redFlags} items={report.redFlags} danger />
      )}
      {report.confidence && (
        <Field
          label={strings.confidence}
          value={CONFIDENCE_LABELS[report.confidence] ?? report.confidence}
        />
      )}
      {report.disclaimer && (
        <Text style={styles.disclaimer}>{report.disclaimer}</Text>
      )}
    </View>
  );
}

export default function BatchDetailScreen({
  id,
  navigate,
}: {
  id: string;
  navigate: (s: Screen) => void;
}) {
  const [batchAnalysis, setBatchAnalysis] = useState<BatchAnalysisItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBatchDetail = async () => {
      try {
        const res = await api.getBatchAnalyses({ limit: 100, offset: 0 });
        const found = res.batchAnalyses.find((b) => b.id === id);
        if (found) {
          setBatchAnalysis(found);
        }
      } catch (err) {
        console.error('Failed to load batch detail:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBatchDetail();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!batchAnalysis) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>找不到分析記錄</Text>
          <TouchableOpacity
            style={styles.back}
            onPress={() => navigate({ name: 'aiHistory' })}>
            <Text style={styles.backText}>{strings.back}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const report = batchAnalysis.reportJson ?? null;
  const typeLabel = batchAnalysis.type === 'PEE' ? strings.peeType : strings.pooType;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>
          {batchAnalysis.type === 'PEE' ? '💧' : '💩'} {typeLabel} 批量分析
        </Text>
        <Text style={styles.meta}>
          {batchAnalysis.days} 天 · {batchAnalysis.recordCount} 筆記錄
        </Text>
        <Text style={styles.meta}>
          {new Date(batchAnalysis.completedAt ?? batchAnalysis.createdAt).toLocaleString('zh-HK')}
        </Text>

        <View style={styles.card}>
          <BatchReportView report={report} />
        </View>

        <TouchableOpacity
          style={styles.back}
          onPress={() => navigate({ name: 'aiHistory' })}>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  meta: { fontSize: 14, color: theme.colors.muted, marginTop: theme.spacing.xs },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  fieldRow: { marginBottom: theme.spacing.sm },
  fieldLabel: { fontSize: 13, color: theme.colors.muted },
  fieldValue: { fontSize: 16, color: theme.colors.text, marginTop: 2 },
  summary: { fontSize: 16, color: theme.colors.text, marginBottom: theme.spacing.sm },
  listBlock: { marginTop: theme.spacing.sm },
  listTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  listItem: { fontSize: 15, color: theme.colors.text, marginTop: 4, lineHeight: 21 },
  dangerText: { color: theme.colors.danger },
  disclaimer: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.danger,
    marginBottom: theme.spacing.md,
  },
  back: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  backText: { color: theme.colors.primary, fontSize: 16, fontWeight: '600' },
});