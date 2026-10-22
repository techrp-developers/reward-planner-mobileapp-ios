import React from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import ChatMessageBubble from '../src/modules/chat/components/ChatMessageBubble';
import { CHAT_THEMES } from '../src/modules/chat/theme/chatThemes';
import type { ChatMessage } from '../src/modules/chat/types';

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('../src/theme/ThemeContext', () => ({
  useAppTheme: () => ({ isDark: false, theme: {} }),
}));
jest.mock('../src/config/apiConfig', () => ({ normalizeLocalCmsImageUrl: (value?: string) => value ?? null }));

const preset = CHAT_THEMES[0];
const base: ChatMessage = {
  message_id: 10,
  conversation_id: 1,
  sender_id: 7,
  sender_name: 'Asha',
  message_type: 'image',
  body: null,
  attachment_url: 'https://cdn.example.com/photo.jpg',
  created_at: '2026-10-22T10:00:00Z',
} as ChatMessage;
const noop = () => {};

let renderer: ReactTestRenderer;
afterEach(async () => { if (renderer) await act(async () => renderer.unmount()); });

const render = async (message: ChatMessage, mine: boolean) => {
  await act(async () => {
    renderer = create(
      <ChatMessageBubble
        message={message}
        mine={mine}
        group={false}
        showName={false}
        showAvatar={false}
        preset={preset}
        onReply={noop}
        onActions={noop}
        onImage={noop}
        onFile={noop}
        onQuote={noop}
        onRetry={noop}
        onVote={async () => {}}
      />,
    );
  });
  const bubble = renderer.root.find(
    node => typeof node.type === 'string' && /^Long press/.test(node.props.accessibilityHint ?? ''),
  );
  return StyleSheet.flatten(bubble.props.style);
};

it.each([true, false])('renders photos without a coloured bubble (mine=%s)', async mine => {
  const style = await render(base, mine);
  expect(style.backgroundColor).toBe('transparent');
  expect(style.padding).toBe(0);
  expect(style.borderWidth ?? 0).toBe(0);
  expect(renderer.root.findAllByType(Image)).toHaveLength(1);
});

it('keeps the theme colour on text bubbles', async () => {
  const style = await render({ ...base, message_type: 'text', body: 'Hi', attachment_url: null } as ChatMessage, true);
  expect(style.backgroundColor).toBe(preset.accent);
});

it('shows a fallback when the photo fails to load', async () => {
  await render(base, false);
  await act(async () => renderer.root.findByType(Image).props.onError());
  expect(renderer.root.findAllByType(Text).some(text => text.props.children === 'Photo unavailable')).toBe(true);
});
