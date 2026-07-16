import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { ServiceDocument } from '../../api/OrderAPI';

type Props = {
  documents: ServiceDocument[];
};

export default function ServiceDocumentsCard({ documents }: Props) {
  if (documents.length === 0) return null;

  const uploadedCount = documents.filter(d => d.uploaded).length;

  const openFile = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="file-multiple-outline" size={16} color="#7C3AED" />
        <Text style={styles.title}>Documents</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{uploadedCount}/{documents.length}</Text>
        </View>
      </View>

      {/* Document rows */}
      {documents.map(doc => (
        <View key={doc.service_document_id} style={styles.row}>
          <MaterialCommunityIcons
            name={doc.uploaded ? 'file-check-outline' : 'file-clock-outline'}
            size={18}
            color={doc.uploaded ? '#16A34A' : '#9CA3AF'}
            style={styles.rowIcon}
          />

          <View style={styles.rowBody}>
            <Text style={styles.docName} numberOfLines={1}>
              {doc.document_name}
            </Text>
            <View style={styles.badges}>
              {doc.is_mandatory && (
                <View style={styles.mandatoryBadge}>
                  <Text style={styles.mandatoryText}>Required</Text>
                </View>
              )}
              {doc.uploaded ? (
                <View style={styles.uploadedBadge}>
                  <Text style={styles.uploadedText}>Uploaded</Text>
                </View>
              ) : (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>Pending</Text>
                </View>
              )}
              {doc.expiry_date && (
                <Text style={styles.expiryText}>
                  Exp: {new Date(doc.expiry_date).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </Text>
              )}
            </View>
          </View>

          {doc.file_url && (
            <TouchableOpacity
              onPress={() => openFile(doc.file_url!)}
              style={styles.viewBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="eye-outline" size={18} color="#7C3AED" />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginTop: 12,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  title: { fontSize: 13, fontWeight: '700', color: '#374151', flex: 1 },
  countBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  countText: { fontSize: 11, fontWeight: '700', color: '#7C3AED' },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  rowIcon: { marginTop: 2 },
  rowBody: { flex: 1 },
  docName: { fontSize: 13, color: '#111827', fontWeight: '500', marginBottom: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center' },

  mandatoryBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  mandatoryText: { fontSize: 10, fontWeight: '700', color: '#DC2626' },

  uploadedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  uploadedText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },

  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pendingText: { fontSize: 10, fontWeight: '700', color: '#D97706' },

  expiryText: { fontSize: 10, color: '#6B7280' },

  viewBtn: { padding: 4 },
});
