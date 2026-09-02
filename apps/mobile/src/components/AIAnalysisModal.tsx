import { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { strings } from '../i18n';
import { Pop } from './Animations';

type Params = { type: 'PEE' | 'POO'; days: number; force?: boolean };

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (params: Params) => void;
  submitting?: boolean;
};

export default function AIAnalysisModal({
  visible,
  onClose,
  onSubmit,
  submitting = false,
}: Props) {
  const [selectedType, setSelectedType] = useState<'PEE' | 'POO'>('PEE');
  const [selectedDays, setSelectedDays] = useState(7);

  const handleSubmit = () => {
    onSubmit({ type: selectedType, days: selectedDays });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay} onTouchStart={onClose} />
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>AI 分析</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={theme.colors.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>分析類型</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                selectedType === 'PEE' && styles.typeBtnSelected,
              ]}
              onPress={() => setSelectedType('PEE')}>
              <Pop selected={selectedType === 'PEE'}>
                <View style={styles.typeBtnInner}>
                  <Text style={styles.typeEmoji}>💧</Text>
                  <Text style={styles.typeLabel}>{strings.pee}</Text>
                </View>
              </Pop>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                selectedType === 'POO' && styles.typeBtnSelected,
              ]}
              onPress={() => setSelectedType('POO')}>
              <Pop selected={selectedType === 'POO'}>
                <View style={styles.typeBtnInner}>
                  <Text style={styles.typeEmoji}>💩</Text>
                  <Text style={styles.typeLabel}>{strings.poo}</Text>
                </View>
              </Pop>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>分析期數 (最多 7 日)</Text>
          <View style={styles.daysRow}>
            {Array.from({ length: 7 }, (_, i) => i + 1).map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.dayBtn,
                  selectedDays === d && styles.dayBtnSelected,
                ]}
                onPress={() => setSelectedDays(d)}>
                <Pop selected={selectedDays === d}>
                  <Text style={[
                    styles.dayBtnText,
                    selectedDays === d && styles.dayBtnTextSelected,
                  ]}>
                    {d} 日
                  </Text>
                </Pop>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}>
            <Text style={styles.submitText}>
              {submitting ? strings.loading : '開始分析'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modal: {
    margin: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: theme.spacing.lg,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  title: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
  section: { marginBottom: theme.spacing.lg },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  typeBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 20,
    paddingVertical: theme.spacing.md,
  },
  typeBtnSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF4E0',
  },
  typeBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  typeEmoji: { fontSize: 24 },
  typeLabel: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  dayBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBtnSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  dayBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  dayBtnTextSelected: { color: '#FFFFFF' },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
});