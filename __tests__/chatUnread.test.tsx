import React from 'react';
import { Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
  nonNegativeUnread,
  toUnreadCounts,
  totalUnreadMessages,
  unreadBadgeLabel,
} from '../src/modules/chat/unreadCount';

let mockAuth: { isAuthenticated: boolean; user: { user_id: number } | null } = {
  isAuthenticated: true,
  user: { user_id: 7 },
};
const mockFetchConversations = jest.fn();
let mockSocketListener: ((event: any) => void) | null = null;

jest.mock('../src/modules/common/auth/context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));
jest.mock('../src/modules/chat/api/chatApi', () => ({
  fetchConversations: (...args: unknown[]) => mockFetchConversations(...args),
}));
jest.mock('../src/modules/chat/services/chatSocket', () => ({
  chatSocket: {
    subscribe: (listener: (event: any) => void) => {
      mockSocketListener = listener;
      return () => { mockSocketListener = null; };
    },
    isConnected: () => true,
  },
}));

// Imported after the mocks above are registered.
const {
  useChatUnreadCount,
  reportChatUnreadSnapshot,
  chatUnreadRevision,
  __resetChatUnreadForTests,
} = require('../src/modules/chat/hooks/useChatUnreadCount');
const { notifyChatReadConfirmed } = require('../src/modules/chat/chatUnreadEvents');

function Badge({ enabled = true }: { enabled?: boolean }) {
  return <Text>{String(useChatUnreadCount(enabled))}</Text>;
}

const flush = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
const shown = (renderer: ReactTestRenderer) =>
  renderer.root.findByType(Text).props.children;
const incoming = (conversationId: number, messageId: number, senderId = 9) =>
  act(() => mockSocketListener?.({
    type: 'message:new',
    data: { conversation_id: conversationId, message_id: messageId, sender_id: senderId },
  }));

let renderer: ReactTestRenderer;
beforeEach(() => {
  __resetChatUnreadForTests();
  mockAuth = { isAuthenticated: true, user: { user_id: 7 } };
  mockFetchConversations.mockReset();
  mockSocketListener = null;
});
afterEach(async () => { if (renderer) await act(async () => renderer.unmount()); });

describe('unread count helpers', () => {
  it('totals unread messages across conversations', () => {
    const counts = toUnreadCounts([
      { conversation_id: 1, unread_count: 3 },
      { conversation_id: '2', unread_count: '4' },
      { conversation_id: 'bad', unread_count: 50 },
    ]);
    expect(totalUnreadMessages(counts)).toBe(7);
  });

  it('caps the label at 99+ and ignores invalid values', () => {
    expect(unreadBadgeLabel(1)).toBe('1');
    expect(unreadBadgeLabel(99)).toBe('99');
    expect(unreadBadgeLabel(100)).toBe('99+');
    expect(nonNegativeUnread(-3)).toBe(0);
    expect(nonNegativeUnread('abc')).toBe(0);
  });
});

describe('shared unread badge store', () => {
  it('starts from the server count and increments once per incoming message', async () => {
    mockFetchConversations.mockResolvedValue([
      { conversation_id: 1, unread_count: 3 },
      { conversation_id: 2, unread_count: 4 },
    ]);
    await act(async () => { renderer = create(<Badge />); });
    await flush();
    expect(shown(renderer)).toBe('7');

    await incoming(1, 501);
    expect(shown(renderer)).toBe('8');
    await incoming(1, 501); // duplicate socket delivery
    expect(shown(renderer)).toBe('8');
    await incoming(1, 502, 7); // own message echoed back
    expect(shown(renderer)).toBe('8');
  });

  it('discards a REST response that started before a newer socket event', async () => {
    let resolveFirst: (value: unknown) => void = () => {};
    mockFetchConversations
      .mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }))
      .mockResolvedValueOnce([{ conversation_id: 1, unread_count: 1 }]);
    await act(async () => { renderer = create(<Badge />); });

    await incoming(1, 900);
    expect(shown(renderer)).toBe('1');
    await act(async () => resolveFirst([{ conversation_id: 1, unread_count: 0 }]));
    // The stale zero must not hide the new message; a fresh request confirms it.
    expect(shown(renderer)).toBe('1');
    await flush();
    expect(mockFetchConversations).toHaveBeenCalledTimes(2);
    expect(shown(renderer)).toBe('1');
  });

  it('re-reads the server count after a confirmed read and hides at zero', async () => {
    mockFetchConversations
      .mockResolvedValueOnce([{ conversation_id: 1, unread_count: 2 }])
      .mockResolvedValueOnce([{ conversation_id: 1, unread_count: 0 }]);
    await act(async () => { renderer = create(<Badge />); });
    await flush();
    expect(shown(renderer)).toBe('2');
    await act(async () => notifyChatReadConfirmed(1));
    await flush();
    expect(shown(renderer)).toBe('0');
  });

  it('shares the inbox snapshot and keeps the count across consumers', async () => {
    mockFetchConversations.mockReturnValue(new Promise(() => {}));
    await act(async () => { renderer = create(<><Badge /><Badge enabled={false} /></>); });
    act(() => reportChatUnreadSnapshot(7, [{ conversation_id: 3, unread_count: 5 }], chatUnreadRevision()));
    await flush();
    const values = renderer.root.findAllByType(Text).map(text => text.props.children);
    expect(values).toEqual(['5', '5']);
  });

  it("clears the previous employee's count on logout", async () => {
    mockFetchConversations.mockResolvedValue([{ conversation_id: 1, unread_count: 4 }]);
    await act(async () => { renderer = create(<Badge />); });
    await flush();
    expect(shown(renderer)).toBe('4');
    mockAuth = { isAuthenticated: false, user: null };
    await act(async () => renderer.update(<Badge />));
    expect(shown(renderer)).toBe('0');
  });
});
