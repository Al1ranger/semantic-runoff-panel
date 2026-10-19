# SemanticRunoffPanel

**Public, source-bound preference transcription with conservative weighted runoff.**

A small fixed panel adopts natural-language ballot statements by signing transactions. GenLayer validators independently retrieve the complete published statement, verify its byte commitment, and transcribe only explicitly ordered preferences. Deterministic runoff transfers fixed voting weight to the next continuing preference. The AI never scores candidate quality or chooses the winner.

Experimental and unaudited. Not for public elections, political governance, custody or high-stakes decisions. No identity verification, secret ballot, coercion resistance, Sybil resistance or legal validity is supplied. Fixed addresses do not prove distinct humans; configured weights are not stake. No fund or execution authority is transferred.

## Problem and GenLayer boundary

A conventional ballot contract requires structured rankings. A private language parser can misread exclusions, fallbacks or abstention without transparent review. Here, multiple validators independently transcribe the exact source adopted by the signing participant. The complete report must match before a participant's ballot slot changes. Changing a fallback can change the final winner even when the first preference stays identical.

The ballot is an authored preference, not a factual assertion about service delivery or another person's conduct. A transaction adopts exact source bytes as that address's preference; it does not prove who authored the source, who controls the address in real life, or whether a source author is honest. Independent retrieval and interpretation protect the transcription boundary, not external reality.

## Architecture

```text
Immutable slate + address/weight roster + deadline
                        ↓ participant-signed source adoption
Full commit-pinned document fetched by leader AND validators
                        ↓ independent ranked preference / abstain / unclear
Exact complete-report agreement
                        ↓ participant-only revision, immutable attempt record
All usable ballots OR deadline → permissionless finalization
                        ↓ weight-conserving runoff transcript
ELECTED / TIED_LAST / NO_VOTES / INCOMPLETE
                        ↓ root-bound winner view; no certificate or consumption
```

No owner can edit the slate, weights, deadline or another participant's ballot. No graph proposals, capacities, compatibility matrix, auction price, fulfillment claim or one-time certificate exist. [Architecture comparisons](docs/architecture.md) distinguish this from Consensus Selection, SemanticFlowEnvelope and prediction scoring. Instant-runoff is established machinery, not a newly invented algorithm. No universal novelty or steward-acceptance claim is made.

## State and rules

- `open_poll(nonce, slate, roster, duration_seconds)`: fixes 2–4 candidates, 2–8 unique nonzero addresses, integer weights 1–100, and 60–86400-second duration. Maximum eight polls per creator.
- `cast(poll_id, expected_revision, coordinate, expected_sha)`: only a roster member, only before deadline/finalization, at most three committed attempts. Coordinates must pin a full 40-hex GitHub commit. No inline ranking is accepted.
- `RANKED` requires a unique nonempty partial ranking of slate IDs. `ABSTAIN` is explicit refusal to vote. `UNCLEAR` means ambiguous/unordered preference, not abstention. Missing, mismatched or invalid sources give `HELD`, never a usable ballot.
- An accepted revision replaces only that member's slot. A HELD/UNCLEAR revision supersedes an earlier usable ballot conservatively; it does not silently retain the participant's old preference. Every attempt remains independently readable.
- Anyone can `finalize` early once **every** member has RANKED or ABSTAIN. This means an accepted ballot may become final before its author attempts another revision. Otherwise finalization after the deadline produces INCOMPLETE, with no winner. No owner veto or wait-for-owner dependency exists.
- Each round assigns each ranked ballot's **entire fixed weight once** to its first continuing preference. A strict majority is more than half the **continuing**, not initial, weight. Exhausted partial ballots and explicit abstentions are accounted separately.
- Without a majority, remove the unique lowest candidate and transfer preferences. A tied last place halts as TIED_LAST rather than using ordering, timing or an arbitrary draw. Zero continuing weight gives NO_VOTES.
- `winner(poll_id, expected_final_root)` returns a candidate only for ELECTED under the exact terminal root. All other outcomes deny this view. It grants no exclusive right or permission to execute an action.

The transfer concept is described by the [Maine Secretary of State](https://www.maine.gov/sos/elections-voting/upcoming/ranked-choice-voting-tabs). This implementation's fixed weights, incomplete-panel handling and halt-on-tied-last policy are explicit custom rules, **not** an implementation or interpretation of any jurisdiction's election law.

## Evidence and consensus

Only `https://raw.githubusercontent.com/OWNER/REPO/FULL_COMMIT/path.json` is derived from validated coordinates. Require HTTP 200, full response 1–2048 bytes, strict UTF-8 and exact SHA-256. No truncation, branch-name source, user score or metadata-only proof is accepted. Historical pinning is not freshness.

The source schema is exactly `{"schema":"semantic-ballot-v1","statement":"..."}` with a 10–800-byte statement. Duplicate JSON keys, extra fields and control characters fail closed. The prompt treats source text as untrusted data, interprets negations and conditional fallbacks, and prohibits invented ranks or winner selection. Each validator independently fetches and retranscribes the statement, then compares the **entire report**, including the full ranking, source body/hash, status and bound poll/member/revision. No confidence tolerance is used. Malformed model output or validator disagreement does not commit an attempt.

Consensus is not semantic infallibility. Shared model errors or prompt injection may survive agreement. Public preferences are visible to validators and readers. Do not submit private data.

## Example

Weights `[2,2,1]` adopt [Archive → Beacon → Canopy](examples/archive.json), [Beacon → Canopy → Archive](examples/beacon.json) and [Canopy → Beacon → Archive](examples/canopy.json).

First round: Archive 2, Beacon 2, Canopy 1. Canopy is uniquely last; its weight transfers to Beacon. Second round: Archive 2, Beacon 3 → Beacon elected. With equal weights, all three tie and no winner is returned. An [unordered equal preference](examples/unclear.json) is UNCLEAR, not an abstention. [Explicit abstention](examples/abstain.json) is different.

Actual outcomes, receipts and failures belong in [LIVE_PROOFS.md](LIVE_PROOFS.md). The fixtures are developer-authored adopted preferences, not evidence of real people voting. Planned steps are not onchain proofs.

## Install and test

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
npm ci --ignore-scripts
.\.venv\Scripts\genvm-lint.exe check contracts/SemanticRunoffPanel.py
.\.venv\Scripts\python.exe -m pytest tests -q
npm run test:unit
npm run test:sdk
```

33 Python tests, 4 JS tests, 6 SDK calldata roundtrips. Python checks all 3,375 triples of nonempty partial three-candidate rankings under three weight profiles: **10,125 cases**, compared with an independent set-based tally. JS uses a separate cursor-based tally and checks another 1,000 triples. Tests cover transfer, exhaustion, abstention, ties, exact deadlines, unauthorized casting, stale revisions, immutable attempts, source/context substitution, post-consensus revalidation and model parse failures. Direct mode runs only the leader; extracted callback tests separately verify actual independent reacquisition/comparison. Live consensus is tested separately.

The Windows test shim narrowly defers gltest's open-temp-file unlink. The clock helper synchronizes gltest's raw message timestamp after `warp`; it does not alter contract deadline code or suppress errors.

## Deployment and interaction

Use a dedicated encrypted keystore with native signing; never export keys into scripts, environment variables, Git or chat. StudioNet is gasless and needs no funding. CLI version: `genlayer@0.39.2`.

```powershell
npm install -g genlayer@0.39.2
genlayer network set studionet
genlayer account use YOUR_DEDICATED_TEST_ACCOUNT
genlayer account unlock
genlayer deploy --contract contracts/SemanticRunoffPanel.py
genlayer write ADDRESS open_poll --args panel-v1 'a:Archive|b:Beacon|c:Canopy' 'MEMBER_ADDRESS:2|OTHER_ADDRESS:1' 3600
genlayer write ADDRESS cast --args POLL_ID 0 OWNER/REPO/FULL_COMMIT/examples/archive.json FULL_SHA256
genlayer write ADDRESS finalize --args POLL_ID
genlayer receipt TRANSACTION_HASH
genlayer code ADDRESS
genlayer call ADDRESS get_poll --args POLL_ID
genlayer call ADDRESS winner --args POLL_ID FINAL_ROOT
```

Participants sign their own `cast` calls. The CLI requires careful string argument handling; fixtures use nonnumeric hex commitments. The public slate and roster formats avoid nested JSON argument quoting.

`scripts/complete-proofs.mjs PUBLISHED_FIXTURE_COMMIT` executes only the bounded demo, journals hashes before polling, preserves failures and refuses uncertain rebroadcast. It uses named native encrypted test accounts; `RUNOFF_CLI_PATH` may select an installed CLI. `pin-context.cjs` changes signer/network only inside that CLI process, not global configuration. Signer names/addresses are public, never keys.

`node scripts/check.mjs source ADDRESS` compares retrieved code. `node scripts/check.mjs state ADDRESS POLL_ID` independently reconstructs all immutable attempts, source integrity, participant/revision bindings, terminal roots and runoff rounds. `node scripts/verify-live.mjs` rechecks the complete published ledger without any wallet or transaction send. Never infer success from FINALIZED alone: inspect execution, agreeing consensus and committed state.

See [SECURITY.md](SECURITY.md). No security audit, privacy, public-election suitability or real-world identity assurance is claimed.
