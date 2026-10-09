<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Platform keys stay server-only; user credentials remain encrypted.
- Social outputs use `src/lib/post-format.ts` across site, queue, and Telegram.
- Cloud browsing uses `src/lib/cloud-browser.server.ts`; sensitive intents require owner approval.
- Multi-step browsing uses `browser-agent.server.ts`; page content is untrusted and sensitive clicks need approval.
- Global destinations stay in AppShell rail; employee pages share a centered tools/bell/account header; design editing stays in chat to preserve context.
- Desktop AppShell collapses to an employee icon rail with local persistence; align fixed chat overlays to its width.
- Rail expands independently; chat controls clear both sidebars; embedded chat hides the rail to avoid overlap.
- `runEmployeeTurn` delegates out-of-specialty work via smartHandoff while keeping the conversation.
- Employee tools live in `employee-toolbelt.ts`; browser tasks stop before payment.
- Chat action commands use `chat-commands.ts`; edits use `reviseEmployeeAction`.
- All employee paths derive research depth, reasoning effort, risk, and success checks from `src/lib/turn-plan.ts`; this prevents conflicting execution decisions.
- Telegram actions and manual credentials stay in-chat; no flow depends on website deep links.
- Brand data is optional per turn via `src/lib/brand-relevance.ts` (opt-out/opt-in from recent user messages); forcing the brand name into every post broke user intent.
- Messages.outputs retains full chat deliverables; drafts enter tasks only by user choice, while pendingAction retains sensitive execution approval across refreshes. Why: viewing work must not require a queue.
- Semantic memory lives in `knowledge_chunks` (google/gemini-embedding-2, 3072 dims) via `src/lib/knowledge.server.ts`; never mix embedding models in that column.
- Public site origin comes from `src/lib/site-origin.ts`; do not hard-code other lovable.app hosts.
- Chat research requests run `runBrowserAgent` inside the turn and stream `browser`/`step` events to the chat; employees never redirect users to colleagues (routing is silent). Why: users need real results and live visibility, not hand-off ping-pong.
- Signup CTAs enter /welcome then /auth; external Google OAuth returns to public /auth before /app. Bind website drafts only to new accounts. Why: preserve introduction and invite intent without cross-account reuse.
- Pre-signup previews read few same-site pages, then one rate-limited, host-cached AI pass. Why: bounded anonymous cost.
- Website swatches use declared theme and same-site brand tokens, not color frequency or defaults, to preserve branding.
- Pre-signup recommendations: short, rate-limited, validated, grounded in sector/public site; no implied metrics.
- Welcome purpose variants live in a browser-safe shared module used by every tour/recommendation path, avoiding business-only claims.
- Chat capabilities and owner guidelines derive from shared skills; guideline rows are scoped to one employee.
- Each workspace has one persistent conversation per employee across web/Telegram; preserve history and unread state.
- Website context is controlled by one workspace-level switch that every employee execution path must honor.
- Chat voice dictation records in the browser and streams transcription through the authenticated `/api/transcribe` route into the draft (never auto-sends). Why: users review spoken text before it reaches an employee.
- Team workspace = real human members (invite-bound) sharing projects/tasks; tasks may also be assigned to one digital employee run via `collab-ai.functions.ts`, and activity is written only by DB triggers. Why: shared human+AI board without exposing owner-private data.
- Team spaces share employee chats: stream route verifies membership, runs turn via admin client; messages store sender. Why: shared human+AI threads.
- Invitees accept/decline in the AppShell NotificationBell (`invite-inbox.functions.ts`); inviters get a `user_notifications` row. Why: no reliance on copied links.
- Project spaces get a team block (members + sender) in employee turns; stream passes verified client+sender. Why: chats address the team.
- Referral earnings require verified payments and refund maturity; users cannot write them.
- Feedback/support are private (RLS).
- Chat media uses `ChatAttachments` with bounded sizing, fullscreen viewing and avatar-side assistant alignment. Why: preserve sender attribution.
- AccountMenu owns UI; AppShell owns auth/data. Account entry points only; uniform stays in settings to avoid duplicates.
- Settings links/history use router search.
- Employee IDs are permanent (DB/URLs).
- Brand references: bounded PDF/Office extraction, owner auth, private originals; why: protect source documents.
- Brand links reuse onboarding safe reader; why: avoid bot-block divergence.
- Gateway key via `ai-key-health.server.ts`; rejected keys fall back to Gemini. Why: Vercel may hold a stale key.
- Webhook/login/OAuth origins default to `SITE_ORIGIN`; Vercel maxDuration set in vite.config. Why: old hosts are dead.
