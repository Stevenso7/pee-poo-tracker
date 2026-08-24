import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  RECORD_TYPE_LABELS,
  PEE_COLOR_LABELS,
  PEE_FOAM_LABELS,
  PEE_VOLUME_LABELS,
  POO_COLOR_LABELS,
  POO_CONSISTENCY_LABELS,
  type AnalysisReport,
} from '@pee-poo/shared';
import { theme } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { strings } from '../i18n';
import { api, ApiError, type RecordItem } from '../services/api';
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.listBlock}>
      <Text style={styles.listTitle}>{title}</Text>
      {children}
    </View>
  );
}

function AnalysisView({ report }: { report: AnalysisReport }) {
  const obs = report.observations ?? {};
  return (
    <View>
      <Text style={styles.summary}>{report.summary}</Text>

      {Object.keys(obs).length > 0 && (
        <Section title={strings.observations}>
          {obs.color ? <Field label={strings.color} value={obs.color} /> : null}
          {obs.clarity ? (
            <Field label={strings.clarity} value={obs.clarity} />
          ) : null}
          {obs.foam ? <Field label={strings.foam} value={obs.foam} /> : null}
          {obs.consistency ? (
            <Field label={strings.consistency} value={obs.consistency} />
          ) : null}
        </Section>
      )}

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

export default function RecordDetailScreen({
  id,
  navigate,
}: {
  id: string;
  navigate: (s: Screen) => void;
}) {
  const [record, setRecord] = useState<RecordItem | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    api
      .getRecord(id)
      .then(setRecord)
      .catch(() => undefined);
    api
      .getPhotoUrl(id)
      .then((r) => setPhotoUrl(r.url))
      .catch(() => undefined);
  }, [id]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { analysis } = await api.analyze(id, false);
      setRecord((prev) => (prev ? { ...prev, analysis } : prev));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          Alert.alert(strings.quotaExhausted);
        } else if (err.status === 400) {
          Alert.alert(strings.noPhoto);
        } else {
          Alert.alert(strings.error, err.message);
        }
      } else {
        Alert.alert(strings.error, strings.analysisFailed);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  if (!record) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  const report = record.analysis?.reportJson ?? null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>
          {record.type === 'PEE' ? '💧' : '💩'} {RECORD_TYPE_LABELS[record.type]}
        </Text>
      <Text style={styles.meta}>
        {new Date(record.recordedAt).toLocaleString('zh-HK')}
      </Text>

      <View style={styles.card}>
        {record.type === 'PEE' ? (
          <>
            {record.peeColor ? (
              <Field
                label={strings.color}
                value={PEE_COLOR_LABELS[record.peeColor] ?? record.peeColor}
              />
            ) : null}
            {record.peeFoam ? (
              <Field
                label={strings.foam}
                value={PEE_FOAM_LABELS[record.peeFoam] ?? record.peeFoam}
              />
            ) : null}
            {record.peeVolume ? (
              <Field
                label="量"
                value={PEE_VOLUME_LABELS[record.peeVolume] ?? record.peeVolume}
              />
            ) : null}
          </>
        ) : (
          <>
            {record.pooColor ? (
              <Field
                label={strings.color}
                value={POO_COLOR_LABELS[record.pooColor] ?? record.pooColor}
              />
            ) : null}
            {record.pooConsistency != null ? (
              <Field
                label={strings.consistency}
                value={
                  POO_CONSISTENCY_LABELS[record.pooConsistency] ??
                  String(record.pooConsistency)
                }
              />
            ) : null}
          </>
        )}
        {record.notes ? <Field label={strings.notes} value={record.notes} /> : null}
      </View>

      {photoUrl ? (
        <View style={styles.photoWrap}>
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        </View>
      ) : record.photoStoragePath ? (
        <Text style={styles.meta}>{strings.photoNotLoaded}</Text>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>✨ {strings.analysis}</Text>
        {report ? (
          <AnalysisView report={report} />
        ) : (
          <Text style={styles.meta}>{strings.noAnalysisYet}</Text>
        )}
        <TouchableOpacity
          style={styles.analyzeButton}
          onPress={runAnalysis}
          disabled={analyzing}
        >
          <Text style={styles.analyzeText}>
            {analyzing
              ? strings.analyzing
              : report
                ? strings.analyzeAgain
                : strings.analyze}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.back}
        onPress={() => navigate({ name: 'history' })}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
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
  photoWrap: { alignItems: 'center', marginTop: theme.spacing.md },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  analyzeButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  analyzeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  back: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  backText: { color: theme.colors.primary, fontSize: 16, fontWeight: '600' },
});
