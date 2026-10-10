import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { chatImageUrl, initials } from '../utils';

export default function ChatAvatar({ name, uri, size = 52, online = false }: { name?: string; uri?: string | null; size?: number; online?: boolean }) {
  const source = chatImageUrl(uri);
  return (
    <View style={{ width: size, height: size }}>
      {source ? (
        <Image source={{ uri: source }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{initials(name)}</Text>
        </View>
      )}
      {online ? <View style={styles.online} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { backgroundColor: '#E5E7EB' },
  fallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDE9FE' },
  initials: { color: '#6D28D9', fontWeight: '800' },
  online: { position: 'absolute', width: 13, height: 13, borderRadius: 7, right: 0, bottom: 1, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFFFFF' },
});
