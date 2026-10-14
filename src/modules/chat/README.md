# Reward Planners chat

The existing `ChatStack` routes remain in place. The module uses the app's auth provider, authenticated Axios client, configured chat server, and existing REST/WebSocket contracts. No dependencies were added.

## Screens and interactions

- Inbox: searchable, activity-sorted conversations, unread badges, direct-chat presence, group identification, refresh/error states, one New Chat entry, and the existing bottom navigation.
- Conversation: theme-aware grouped bubbles, native keyboard avoidance, safe-area composer, cursor-aware emoji insertion, swipe/long-press reply, quoted-message navigation, copy, owner-only delete with confirmation, optimistic text messages, pending/failed/sent/read states, and retry.
- Sharing: gallery preview, upload status, image viewer with native iOS pinch zoom, document picker/local-copy handling and safe HTTP(S) links, keyboard-safe polls, and dismissal-before-presentation sequencing for native sheets/pickers.
- Groups and members: selected-member chips, race-safe coworker search, creation guards, real member metadata, avatar error fallback, group image upload/removal, and confirmation before removal. The server continues to authorize group-photo operations.
- Appearance: existing theme keys, live shared updates, optimistic selection with rollback, light/dark previews, and readable outgoing bubble colors.

## Reliability

`ChatStack` owns the singleton socket connection. Reconnects use the existing token storage and authenticated Axios refresh interceptor. Old socket callbacks cannot affect replacement connections, and stack teardown releases the socket and AppState listener. Screen listeners and polling exist only while focused; background polling is paused.

Reconnect recovery merges messages and walks older pages until the latest previously loaded server message is reached. Pagination preserves loaded history and visible content. HTTP acknowledgements, socket echoes, and retries reconcile by server ID and `client_message_id`. Confirmed messages cannot be downgraded by stale local failures. Deletion tombstones prevent stale events from restoring content. Other users' poll updates preserve the current user's choices.

Text retries keep their client ID. Photo retries reuse both their client ID and completed upload. Poll creation retries retain the draft's client ID. Conversation creation retains a successful server ID if opening the conversation later fails.

Receipts represent pending local send, server confirmation, and server-confirmed reading. The supplied contract does not distinguish delivery to a device, so no separate delivered state is displayed.

## Validation

- Native iOS Debug simulator build: succeeded.
- iOS and Android release JavaScript bundles: compiled with Metro.
- Focused chat/navigation checks: 35 tests passing across five suites. These cover message reconciliation, pagination, reply IDs, text/photo/poll retries, deletion races, poll selection/closure/validation, receipts, socket lifecycle, and native-sheet sequencing.
- Project TypeScript check: all seven initial chat errors resolved. Five pre-existing errors remain in the auth module: missing `checkIdentifier`, `CheckExistenceResponse`, `VerifyOtpResponse`, `completeOnboarding`, and `authenticateWithTokens`.
- Full Jest run: unrelated setup failures in the OTP suite (Reanimated), App suite (PNG parsing), and ecommerce lifecycle suite (missing refund utility).
- ESLint: the repository has no ESLint configuration, so the configured lint command cannot run.

## Device/backend acceptance still required

Use authorized test accounts on two devices to verify live messages, unread counts, typing/presence, receipts, reconnect recovery beyond 40 missed messages, replies, deletion, theme synchronization, and personal poll selections. Test creation/opening of direct and group chats and group-photo authorization with both permitted and forbidden accounts.

Test real gallery/document assets, cloud-backed files, picker cancellation, failed uploads, image viewing/zoom, and supported MIME types. Review keyboard and sheet transitions in light/dark mode, large text, portrait/landscape, and small iPhones; repeat the shared flows on Android. Bundle/unit/build checks do not establish these live acceptance results.
