# Quiz

Dashboard game drawer → Quiz leaderboard → Start / Resume → five questions → result.

The server owns answer keys, deadlines and scores. Each question has 15 seconds;
retries keep its original deadline. Each distinct wrong answer deducts 1 point,
each correct answer awards 2 points, and a timeout deducts 1 point. Scores can
be negative. Already attempted options cannot be selected again. Only the best
completed round counts on the leaderboard. Quiz points do not change wallet balances.

Leaving or backgrounding the app does not pause the current question. Start resumes
an unfinished round; Continue starts the next question's timer. Connection errors
can be recovered with Reconnect without replaying a scoring mutation.

## Backend setup

From `src/server`, run `node scripts/migrate-quiz.js`, then restart the backend.
The connected development app currently uses the sibling `rewardReactApp/server`;
the same quiz backend files and route registration have also been installed there.
The migration is additive and can be rerun safely. It seeds eight questions;
each round chooses five active questions. Add questions to `quiz_questions` with
four JSON options and a zero-based `correct_index`.

Quiz routes require a valid signed access token (the shared development-only
decode fallback is deliberately not used for scored games). Sign in against the
configured backend if a token from another server is rejected.

Authenticated routes under `/v1/quiz`:

- `GET /leaderboard`: top 20 best scores and rules.
- `POST /sessions`: start or resume the user's active round.
- `GET /sessions/:id`: fetch current state and reconcile timeout.
- `POST /sessions/:id/answer`: `{ index, option }`.
- `POST /sessions/:id/next`: `{ index }`; only correct/expired questions advance.

Per-user database locks serialize mutations. Duplicate answers and stale question
requests cannot score twice. Server responses omit current and future answer keys.
Sessions snapshot their questions so edits do not change an active round.

Run focused backend tests from `src/server`:
`node --test app/games/v1/tests/quizPolicy.test.js app/games/v1/tests/quizController.test.js`
