import { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  PEE_COLORS,
  PEE_FOAMS,
  PEE_VOLUMES,
  POO_COLORS,
  POO_CONSISTENCY_LABELS,
  PEE_COLOR_LABELS,
  PEE_FOAM_LABELS,
  PEE_VOLUME_LABELS,
  POO_COLOR_LABELS,
} from '@pee-poo/shared';
import { theme } from '../theme';
import { strings } from '../i18n';
import { api } from '../services/api';
import type { Screen } from '../../App';

type Props = { type: 'PEE' | 'POO'; navigate: (s: Screen) => void };

function Option({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.option, selected && styles.optionSelected]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function LogRecordScreen({ type, navigate }: Props) {
  const [peeColor, setPeeColor] = useState<string>();
  const [peeFoam, setPeeFoam] = useState<string>();
  const [peeVolume, setPeeVolume] = useState<string>();
  const [pooColor, setPooColor] = useState<string>();
  const [pooConsistency, setPooConsistency] = useState<number>();
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(strings.error, '要相片權限先得呀');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(strings.error, '要相機權限先得呀');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0]);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const body =
        type === 'PEE'
          ? {
              type,
              recordedAt: new Date().toISOString(),
              peeColor,
              peeFoam,
              peeVolume,
              notes,
              needsPhotoUpload: !!photo,
            }
          : {
              type,
              recordedAt: new Date().toISOString(),
              pooColor,
              pooConsistency,
              notes,
              needsPhotoUpload: !!photo,
            };

      const { record, photoUploadUrl, photoStoragePath } =
        await api.createRecord(body);

      if (photo && photoUploadUrl && photoStoragePath) {
        const blob = await (await fetch(photo.uri)).blob();
        const putRes = await fetch(photoUploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': photo.mimeType ?? 'image/jpeg' },
          body: blob,
        });
        if (!putRes.ok) {
          throw new Error('相片上載失敗');
        }
        await api.confirmPhoto(record.id, {
          storagePath: photoStoragePath,
          contentType: photo.mimeType ?? 'image/jpeg',
          sizeBytes: photo.fileSize ?? 0,
        });
      }

      Alert.alert(strings.logSuccess);
      navigate({ name: 'home' });
    } catch (err) {
      Alert.alert(
        strings.error,
        err instanceof Error ? err.message : strings.pleaseTryAgain,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigate({ name: 'home' })}
        >
          <Text style={styles.backText}>← {strings.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {type === 'PEE' ? `💧 ${strings.pee}` : `💩 ${strings.poo}`}
        </Text>

      {type === 'PEE' ? (
        <>
          <Text style={styles.label}>{strings.color}</Text>
          <View style={styles.grid}>
            {PEE_COLORS.map((c) => (
              <Option
                key={c}
                label={PEE_COLOR_LABELS[c]}
                selected={peeColor === c}
                onPress={() => setPeeColor(c)}
              />
            ))}
          </View>

          <Text style={styles.label}>{strings.foam}</Text>
          <View style={styles.grid}>
            {PEE_FOAMS.map((f) => (
              <Option
                key={f}
                label={PEE_FOAM_LABELS[f]}
                selected={peeFoam === f}
                onPress={() => setPeeFoam(f)}
              />
            ))}
          </View>

          <Text style={styles.label}>量</Text>
          <View style={styles.grid}>
            {PEE_VOLUMES.map((v) => (
              <Option
                key={v}
                label={PEE_VOLUME_LABELS[v]}
                selected={peeVolume === v}
                onPress={() => setPeeVolume(v)}
              />
            ))}
          </View>
        </>
      ) : (
        <>
          <Text style={styles.label}>{strings.color}</Text>
          <View style={styles.grid}>
            {POO_COLORS.map((c) => (
              <Option
                key={c}
                label={POO_COLOR_LABELS[c]}
                selected={pooColor === c}
                onPress={() => setPooColor(c)}
              />
            ))}
          </View>

          <Text style={styles.label}>{strings.consistency}</Text>
          <View style={styles.grid}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <Option
                key={n}
                label={POO_CONSISTENCY_LABELS[n]}
                selected={pooConsistency === n}
                onPress={() => setPooConsistency(n)}
              />
            ))}
          </View>
        </>
      )}

      <Text style={styles.label}>{strings.photo}</Text>
      {photo ? (
        <View style={styles.photoWrap}>
          <Image source={{ uri: photo.uri }} style={styles.photo} />
          <TouchableOpacity onPress={() => setPhoto(null)}>
            <Text style={styles.removePhoto}>{strings.removePhoto}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.photoButtons}>
          <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
            <Text style={styles.photoButtonText}>📷 {strings.takePhoto}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoButton} onPress={pickPhoto}>
            <Text style={styles.photoButtonText}>🖼️ {strings.pickPhoto}</Text>
          </TouchableOpacity>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder={strings.notesPlaceholder}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <TouchableOpacity
        style={styles.submit}
        onPress={submit}
        disabled={submitting}
      >
        <Text style={styles.submitText}>
          {submitting ? strings.loading : strings.confirm}
        </Text>
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
  backButton: {
    marginBottom: theme.spacing.md,
  },
  backText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  option: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionText: { color: theme.colors.text },
  optionTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  photoWrap: { alignItems: 'center', marginTop: theme.spacing.sm },
  photo: {
    width: 220,
    height: 220,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  removePhoto: {
    color: theme.colors.danger,
    marginTop: theme.spacing.sm,
    fontWeight: '600',
  },
  photoButtons: { flexDirection: 'row', gap: theme.spacing.sm },
  photoButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  photoButtonText: { color: theme.colors.text, fontWeight: '600' },
  input: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    minHeight: 80,
    textAlignVertical: 'top',
    color: theme.colors.text,
  },
  submit: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  submitText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});
