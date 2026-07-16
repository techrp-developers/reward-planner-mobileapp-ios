import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenHeader from '../constant/navbar/ScreenHeaderColor';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, type Asset as PickerAsset } from 'react-native-image-picker';
import type { HomeStackParamList } from '../../navigation/type';
import {
  fetchParentOrderDocuments,
  submitParentOrderDocuments,
  type ServiceDocument,
  type SubmitDocumentPayload,
} from '../../api/DocumentAPI';

// ─── Navigation ───────────────────────────────────────────────────────────────
type NavProps = NativeStackNavigationProp<HomeStackParamList>;
type RouteT = RouteProp<HomeStackParamList, 'DocumentUpload'>;

// ─── Local Types ──────────────────────────────────────────────────────────────
type LocalDoc = ServiceDocument & {
  localUri?: string;
  localName?: string;
  localType?: string;
  // runtime state
  uploadState: 'idle' | 'picking' | 'ready' | 'uploading' | 'done' | 'error';
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getReadableError = (err: any, fallback: string) =>
  String(err?.response?.data?.message || err?.message || err?.error || fallback);

// True only when already submitted to server — used for card visuals (green bg, X button)
const isDocReady = (doc: LocalDoc) =>
  doc.uploadState === 'done' || (doc.uploaded && !!doc.file_url);

// True when a file is picked locally OR already uploaded — used for the submit gate
const isDocFulfilled = (doc: LocalDoc) =>
  isDocReady(doc) || doc.uploadState === 'ready';

// ─── Sub-component: DocCard ───────────────────────────────────────────────────
type DocCardProps = {
  doc: LocalDoc;
  index: number;
  onPick: (doc: LocalDoc) => void;
  onRemove: (key: string) => void;
  disabled: boolean;
};

const DocCard = ({ doc, index, onPick, onRemove, disabled }: DocCardProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const ready = isDocReady(doc);
  const isUploading = doc.uploadState === 'uploading';
  const hasError = doc.uploadState === 'error';

  const statusColor = ready
    ? '#16A34A'
    : hasError
    ? '#DC2626'
    : doc.is_mandatory
    ? '#7C3AED'
    : '#6B7280';

  const cardBorderColor = ready ? '#BBF7D0' : hasError ? '#FECACA' : '#E5E7EB';
  const cardBg = ready ? '#F0FDF4' : hasError ? '#FEF2F2' : '#FFFFFF';

  const displayName =
    doc.localName ||
    (doc.file_url ? doc.file_url.split('/').pop() : null) ||
    null;

  // Preview thumbnail for local images
  const showThumb =
    doc.localUri &&
    (doc.localType?.startsWith('image/') || doc.localUri.match(/\.(jpg|jpeg|png|webp)$/i));
  const isPersistedUpload = doc.uploaded && !doc.localUri;

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: cardBg, borderColor: cardBorderColor },
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Left icon / thumb */}
      <View style={[styles.iconBox, ready && styles.iconBoxDone, hasError && styles.iconBoxError]}>
        {showThumb ? (
          <Image source={{ uri: doc.localUri }} style={styles.thumbImg} />
        ) : (
          <MaterialCommunityIcons
            name={
              ready
                ? 'check-circle'
                : hasError
                ? 'alert-circle'
                : 'file-document-outline'
            }
            size={22}
            color={statusColor}
          />
        )}
      </View>

      {/* Text block */}
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.docName} numberOfLines={1}>
            {doc.document_name}
          </Text>
          {doc.is_mandatory && (
            <View style={styles.mandatoryBadge}>
              <Text style={styles.mandatoryText}>Required</Text>
            </View>
          )}
        </View>

        {/* Expiry info */}
        {doc.is_expirable && (
          <Text style={styles.expiryHint}>
            {doc.expiry_date
              ? `Expires: ${new Date(doc.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : 'Expiry date required'}
          </Text>
        )}

        {/* Document number info */}
        {doc.document_number && (
          <Text style={styles.docNumberText}>#{doc.document_number}</Text>
        )}

        {/* File name or status */}
        {ready ? (
          <Text style={styles.uploadedLabel} numberOfLines={1}>
            {displayName || 'Uploaded'}
          </Text>
        ) : hasError ? (
          <Text style={styles.errorLabel}>Upload failed — tap to retry</Text>
        ) : doc.localName ? (
          <Text style={styles.selectedLabel} numberOfLines={1}>
            {doc.localName}
          </Text>
        ) : (
          <Text style={styles.hintText}>JPG · PNG · PDF · max 5 MB</Text>
        )}
      </View>

      {/* Right action */}
      <View style={styles.cardRight}>
        {isUploading ? (
          <ActivityIndicator size="small" color="#7C3AED" />
        ) : ready ? (
          isPersistedUpload ? (
            <View style={styles.persistedUpload}>
              <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => onRemove(doc.document_key)}
              disabled={disabled}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => onPick(doc)}
            disabled={disabled}
            activeOpacity={0.75}
          >
            <Ionicons name="cloud-upload-outline" size={18} color="#7C3AED" />
            <Text style={styles.uploadBtnText}>
              {doc.localName ? 'Change' : 'Upload'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({
  done,
  total,
  isUploading,
}: {
  done: number;
  total: number;
  isUploading: boolean;
}) => {
  // While actively submitting, show the bar racing to 100% as a live
  // "uploading" indicator instead of the static selected-file count.
  const pct = isUploading ? 100 : total === 0 ? 0 : Math.round((done / total) * 100);
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: pct,
      duration: isUploading ? 900 : 400,
      useNativeDriver: false,
    }).start();
  }, [pct, isUploading, animWidth]);

  const fillColors: [string, string] = pct === 100 && !isUploading
    ? ['#22C55E', '#16A34A']
    : ['#A78BFA', '#7C3AED'];

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>
          {isUploading ? 'Uploading documents…' : `${done} of ${total} selected`}
        </Text>
        <Text style={styles.progressPct}>{pct}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFillWrap,
            {
              width: animWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={fillColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressFill}
          />
        </Animated.View>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const DocumentUpload = () => {
  const navigation = useNavigation<NavProps>();
  const route = useRoute<RouteT>();
  const parentOrderId = String(route.params?.parent_order_id ?? '');

  const [docs, setDocs] = useState<LocalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [error, setError] = useState('');

  // ── Load docs ──
  const loadDocs = useCallback(async () => {
    if (!parentOrderId) {
      setError('Invalid order. Please go back and try again.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await fetchParentOrderDocuments(parentOrderId);
      setCanSubmit(res.data.can_submit);
      setDocs(
        res.data.documents.map(doc => ({
          ...doc,
          is_mandatory: Boolean(doc.is_mandatory),
          uploadState: doc.uploaded ? 'done' : 'idle',
        }))
      );
    } catch (err: any) {
      setError(getReadableError(err, 'Could not load required documents.'));
    } finally {
      setLoading(false);
    }
  }, [parentOrderId]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  // ── Derived counts ──
  const { totalDocs, uploadedDocs, pendingMandatory } = useMemo(() => {
    const total = docs.length;
    // Count as "selected" once a file is picked locally, not only once it's
    // actually been submitted — so the bar fills as you go, not just at the end.
    const uploaded = docs.filter(isDocFulfilled).length;
    const pending = docs.filter(d => d.is_mandatory && !isDocFulfilled(d)).length;
    return { totalDocs: total, uploadedDocs: uploaded, pendingMandatory: pending };
  }, [docs]);

  const anyUploading = docs.some(d => d.uploadState === 'uploading');

  // ── Pick file ──
  const handlePick = useCallback(async (doc: LocalDoc) => {
    setDocs(prev =>
      prev.map(d =>
        d.document_key === doc.document_key ? { ...d, uploadState: 'picking' } : d
      )
    );

    const result = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 1,
      quality: 0.85,
    });

    if (result.didCancel || !result.assets?.[0]) {
      setDocs(prev =>
        prev.map(d =>
          d.document_key === doc.document_key ? { ...d, uploadState: 'idle' } : d
        )
      );
      return;
    }

    if (result.errorMessage) {
      Alert.alert('Picker Error', result.errorMessage);
      setDocs(prev =>
        prev.map(d =>
          d.document_key === doc.document_key ? { ...d, uploadState: 'idle' } : d
        )
      );
      return;
    }

    const file = result.assets[0] as PickerAsset;

    if (file.fileSize && file.fileSize > MAX_FILE_SIZE_BYTES) {
      Alert.alert('File Too Large', 'Maximum allowed size is 5 MB. Please choose a smaller file.');
      setDocs(prev =>
        prev.map(d =>
          d.document_key === doc.document_key ? { ...d, uploadState: 'idle' } : d
        )
      );
      return;
    }

    // Store locally — actual upload happens on Submit
    setDocs(prev =>
      prev.map(d =>
        d.document_key === doc.document_key
          ? {
              ...d,
              localUri: file.uri,
              localName: file.fileName || `${doc.document_key}.jpg`,
              localType: file.type || 'image/jpeg',
              uploadState: 'ready',
              uploaded: false, // mark as not-yet-submitted
            }
          : d
      )
    );
  }, []);

  // ── Remove / re-pick ──
  const handleRemove = useCallback((key: string) => {
    setDocs(prev =>
      prev.map(d =>
        d.document_key === key
          ? {
              ...d,
              localUri: undefined,
              localName: undefined,
              localType: undefined,
              uploadState: 'idle',
              uploaded: false,
              file_url: null,
            }
          : d
      )
    );
  }, []);

  // ── Submit all ──
  const handleSubmit = useCallback(async () => {
    if (pendingMandatory > 0) {
      Alert.alert(
        'Documents Missing',
        `Please select all required documents (${pendingMandatory} remaining).`
      );
      return;
    }

    // Collect docs that need uploading (have a local file selected)
    const toUpload: SubmitDocumentPayload[] = docs
      .filter(d => d.localUri && d.localName && d.localType)
      .map(d => ({
        document_key: d.document_key,
        document_number: d.document_number ?? undefined,
        expiry_date: d.expiry_date ?? undefined,
        file: {
          uri: d.localUri!,
          name: d.localName!,
          type: d.localType!,
        },
      }));

    if (toUpload.length === 0 && !canSubmit) {
      Alert.alert('Nothing to Submit', 'Please select at least one document to upload.');
      return;
    }

    try {
      setSubmitting(true);

      // Mark uploading state visually
      setDocs(prev =>
        prev.map(d =>
          d.localUri ? { ...d, uploadState: 'uploading' } : d
        )
      );

      if (toUpload.length > 0) {
        await submitParentOrderDocuments(parentOrderId, toUpload);
      }

      // Mark all done
      setDocs(prev =>
        prev.map(d =>
          d.uploadState === 'uploading' ? { ...d, uploadState: 'done', uploaded: true } : d
        )
      );

      navigation.navigate('SubmittedSuccessful', {
        statusText: 'Documents Submitted',
        title: 'Documents Uploaded Successfully',
        description: 'Our team will verify your documents and process your service order shortly.',
        enquiryId: parentOrderId,
        redirectToHome: true,
        redirectDelayMs: 3000,
      });
    } catch (err: any) {
      // Mark errored docs
      setDocs(prev =>
        prev.map(d =>
          d.uploadState === 'uploading' ? { ...d, uploadState: 'error' } : d
        )
      );
      Alert.alert('Submission Failed', getReadableError(err, 'Could not submit documents. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }, [docs, pendingMandatory, parentOrderId, canSubmit, navigation]);

  // ── Mandatory / optional split ──
  const mandatoryDocs = useMemo(() => docs.filter(d => d.is_mandatory), [docs]);
  const optionalDocs  = useMemo(() => docs.filter(d => !d.is_mandatory), [docs]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScreenHeader title="Documents Required" onBackPress={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.centeredWrap}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading documents…</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredWrap}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadDocs}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Sticky progress — stays visible while scrolling the document list */}
          <View style={styles.stickyProgress}>
            <ProgressBar done={uploadedDocs} total={totalDocs} isUploading={submitting || anyUploading} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Helper */}
            <Text style={styles.helperText}>
              Select files for each document below. All required documents must be uploaded before
              submitting.
            </Text>

            {/* Mandatory section */}
            {mandatoryDocs.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionTitle}>Required Documents</Text>
                </View>
                {mandatoryDocs.map((doc, i) => (
                  <DocCard
                    key={`${doc.document_key}-${i}`}
                    doc={doc}
                    index={i}
                    onPick={handlePick}
                    onRemove={handleRemove}
                    disabled={submitting || anyUploading}
                  />
                ))}
              </>
            )}

            {/* Optional section */}
            {optionalDocs.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                  <View style={[styles.sectionDot, { backgroundColor: '#9CA3AF' }]} />
                  <Text style={styles.sectionTitle}>Optional Documents</Text>
                </View>
                {optionalDocs.map((doc, i) => (
                  <DocCard
                    key={`${doc.document_key}-opt-${i}`}
                    doc={doc}
                    index={mandatoryDocs.length + i}
                    onPick={handlePick}
                    onRemove={handleRemove}
                    disabled={submitting || anyUploading}
                  />
                ))}
              </>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Sticky footer */}
          <View style={styles.footer}>
            {pendingMandatory > 0 && (
              <Text style={styles.footerHint}>
                {pendingMandatory} required document{pendingMandatory > 1 ? 's' : ''} still needed
              </Text>
            )}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (submitting || anyUploading || pendingMandatory > 0) && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting || anyUploading || pendingMandatory > 0}
              activeOpacity={0.85}
            >
              {submitting || anyUploading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitBtnText}>
                    {pendingMandatory > 0
                      ? `${pendingMandatory} Document${pendingMandatory > 1 ? 's' : ''} Pending`
                      : 'Submit Documents'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },

  // Sticky progress (always visible, sits below ScreenHeader)
  stickyProgress: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },

  // Progress
  progressWrap: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 13.5, color: '#374151', fontWeight: '700' },
  progressPct: { fontSize: 13.5, color: '#7C3AED', fontWeight: '800' },
  progressTrack: { height: 8, backgroundColor: '#F1EFFF', borderRadius: 99, overflow: 'hidden' },
  progressFillWrap: { height: 8 },
  progressFill: { flex: 1, borderRadius: 99 },

  // Helper
  helperText: { fontSize: 13, color: '#6B7280', marginTop: 14, marginBottom: 16, lineHeight: 19 },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7C3AED', marginRight: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', letterSpacing: 0.4, textTransform: 'uppercase' },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  iconBoxDone: { backgroundColor: '#DCFCE7' },
  iconBoxError: { backgroundColor: '#FEE2E2' },
  thumbImg: { width: 44, height: 44, borderRadius: 10 },

  cardBody: { flex: 1, marginRight: 8 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 3 },
  docName: { fontSize: 14, fontWeight: '700', color: '#111827', flexShrink: 1 },

  mandatoryBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mandatoryText: { fontSize: 10, fontWeight: '700', color: '#7C3AED' },

  expiryHint: { fontSize: 11, color: '#F59E0B', fontWeight: '500', marginBottom: 2 },
  docNumberText: { fontSize: 11, color: '#6B7280', marginBottom: 2 },
  hintText: { fontSize: 12, color: '#9CA3AF' },
  uploadedLabel: { fontSize: 12, color: '#16A34A', fontWeight: '600' },
  selectedLabel: { fontSize: 12, color: '#7C3AED', fontWeight: '600' },
  errorLabel: { fontSize: 12, color: '#DC2626', fontWeight: '500' },

  cardRight: { alignItems: 'center', justifyContent: 'center' },
  removeBtn: { padding: 4 },
  persistedUpload: { padding: 4 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  uploadBtnText: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 12,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerHint: { fontSize: 12, color: '#EF4444', fontWeight: '500', textAlign: 'center', marginBottom: 8 },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 5,
  },
  submitBtnDisabled: { backgroundColor: '#C4B5FD', shadowOpacity: 0, elevation: 0 },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  // States
  centeredWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  errorText: { fontSize: 14, color: '#B91C1C', textAlign: 'center', marginTop: 12, marginBottom: 16, lineHeight: 20 },
  retryBtn: { backgroundColor: '#7C3AED', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});

export default DocumentUpload;
