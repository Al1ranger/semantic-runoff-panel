# Security boundary

Experimental, unaudited small-panel preference primitive. No funds, secret ballots, human identity, public-election suitability, coercion resistance, execution permission or delivery certification.

## Invariants

- Fixed roster, slate, deadline and weights are committed at creation. Every cast binds the exact configuration root, poll ID, authenticated message sender, revision and source. Another address cannot overwrite a member's slot or transplant a ballot into another poll.
- Only the current next revision may commit. Three attempts per participant; at most eight members. Previous attempts are immutable. HELD/UNCLEAR revisions explicitly supersede prior usable preferences. No silent fallback to an old vote.
- Complete body hash, strict UTF-8, size limit, exact schema and safe immutable URL coordinates precede model execution. Duplicate JSON keys and caller-supplied structured preferences are not accepted.
- Validators independently refetch and retranscribe all consequential ranks/statuses. Complete exact report comparison, not shape-only checking or first-choice/winner-only equality. Deterministic revalidation occurs after consensus.
- Source failure means HELD, not ABSTAIN. Unclear preference is not abstention. An unresolved or absent member blocks early tally; after the deadline the result is INCOMPLETE, never an election from silently discarded members.
- Finalization is permissionless when every member is usable or after deadline. Once all usable slots exist anyone may finalize before another revision; this early-close rule is intentional. Deadline equality rejects casting.
- Each roster weight is assigned once per round. Continuing + exhausted + abstained weight equals the configured total. Majority is relative to continuing weight, not original total. Tied last halts without a winner; candidate order is not a tie-break.
- Terminal roots bind the exact ballot roots in roster order and complete round transcript. The winner view requires the expected terminal root and ELECTED status. It is read-only and creates no reusable or consumable authority.

## Residual risks

The source is an adopted statement, not independently verified physical truth or proof that a human intended it. Fixed addresses may be controlled by one person; weighted membership is declared configuration, not verified stake or fair representation. Participants and validators can see all preferences. Do not put private information in sources.

Models can share semantic mistakes; consensus does not prove faithful intent extraction. Prompt injection defenses are not complete. Exact comparison can fail availability; malformed output/disagreement does not commit and does not consume the revision. A member can withhold or submit unusable ballots, yielding INCOMPLETE after deadline. No funds can become locked. Historical source commits prove bytes, not currentness or authorship.

No owner, upgrades, token approvals, value transfers or deterministic external calls exist. Per-creator limits are not Sybil-resistant. Direct/mock tests do not prove live consensus; live results are separately labeled in the proof ledger.

Use the repository owner's GitHub contact for private vulnerability reports. Do not include credentials, keystores, tokens or raw provider/node configuration.
