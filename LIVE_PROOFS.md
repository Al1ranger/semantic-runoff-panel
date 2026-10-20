# Live StudioNet proofs

Contract: [0x1e2F510F273E7F3acd814E08f2E1D8Fc312AdD4a](https://explorer-studio.genlayer.com/address/0x1e2F510F273E7F3acd814E08f2E1D8Fc312AdD4a)

Source SHA-256: `a5305bc7d6f5dc0bd77fd90142d1d1c3301a008f0e3d1594794d6ad545835b57`. RPC code matches contracts/SemanticRunoffPanel.py after CRLF normalization.
Fixtures: [282bf572b21a9959515f7a9e2eb1f5f1763e49dd](https://github.com/Al1ranger/semantic-runoff-panel/tree/282bf572b21a9959515f7a9e2eb1f5f1763e49dd/examples). Developer-authored preferences adopted by dedicated test signers, not evidence of real people voting.

## Transaction matrix

| Case | Signer | Lifecycle | Execution | Consensus | Effect | Explorer |
| --- | --- | --- | --- | --- | --- | --- |
| deploy | 0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42 | FINALIZED | SUCCESS | MAJORITY_AGREE | Committed | [transaction](https://explorer-studio.genlayer.com/tx/0x3fd221e1b2a78cb44a0e879201ed55e8dd3f65f14acc6421d9b5d2b24ab6c2b1) |
| open-expiry-v1 | 0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42 | FINALIZED | SUCCESS | MAJORITY_AGREE | Committed | [transaction](https://explorer-studio.genlayer.com/tx/0xd982dda1900e6bfe0c347810adbe17f50d141aff64f1ebc2f59d1cddc5321073) |
| open-transfer-v1 | 0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42 | FINALIZED | SUCCESS | MAJORITY_AGREE | Committed | [transaction](https://explorer-studio.genlayer.com/tx/0x23767bab30420398f1efad6fd7f266c23d73d9ca806d3570b424a177a9501759) |
| source-held | 0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42 | FINALIZED | SUCCESS | MAJORITY_AGREE | Committed | [transaction](https://explorer-studio.genlayer.com/tx/0x56acd341626478e5a5c1002a999dac4812abf5cd88c73e1beb92ed93848a7a9b) |
| unclear-revision | 0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42 | FINALIZED | SUCCESS | MAJORITY_AGREE | Committed | [transaction](https://explorer-studio.genlayer.com/tx/0x390b49e5d1032d73d248abe24c0aabe7e0fe8b73782d53343b49252ced52f474) |
| beacon-ballot | 0x34346773a22564cbcc5F1D67D1c1F9f196DaEA35 | FINALIZED | SUCCESS | MAJORITY_AGREE | Committed | [transaction](https://explorer-studio.genlayer.com/tx/0xc37b2f9cbfc6ee59321c99dc10b712572e47607b0593e043aba98892768c8c76) |
| canopy-ballot | 0x5585Ea8f2FCC126bad0830EB9701E19b3CD800D5 | FINALIZED | SUCCESS | MAJORITY_AGREE | Committed | [transaction](https://explorer-studio.genlayer.com/tx/0x8b8defbea4eb26ff26c779c5adc3f7c28f117d627a84b574effcb19fd4fd2ef1) |
| unresolved-cannot-tally | 0x34346773a22564cbcc5F1D67D1c1F9f196DaEA35 | FINALIZED | ERROR | MAJORITY_AGREE | Expected guard rejection; no mutation | [transaction](https://explorer-studio.genlayer.com/tx/0x5ac192cb68a8cba30d66e749e87aa13be17f7346783e6cd89a192fbd73d607c1) |
| corrected-archive | 0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42 | FINALIZED | SUCCESS | MAJORITY_AGREE | Committed | [transaction](https://explorer-studio.genlayer.com/tx/0x3fe2e046fadd43d36f7f3200696baef55821ff823e448cae9e61d09edd67edf5) |
| replay-revision | 0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42 | FINALIZED | ERROR | MAJORITY_AGREE | Expected guard rejection; no mutation | [transaction](https://explorer-studio.genlayer.com/tx/0x228419954e29f7c41afa886f47cca1aaef860268ca19e8296f95995ef2469a57) |
| finalize-transfer | 0x34346773a22564cbcc5F1D67D1c1F9f196DaEA35 | FINALIZED | SUCCESS | MAJORITY_AGREE | Committed | [transaction](https://explorer-studio.genlayer.com/tx/0x5931cc61081a686885833234e27afbf40be61fbde46a7b474bda80bc46dbab21) |
| terminal-ballot | 0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42 | FINALIZED | ERROR | MAJORITY_AGREE | Expected guard rejection; no mutation | [transaction](https://explorer-studio.genlayer.com/tx/0xf29beed47de8d6ed7318f7ad8fa1a6dfb217db051465352a16cf9e20542b3803) |
| open-tie-v1 | 0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42 | FINALIZED | SUCCESS | MAJORITY_AGREE | Committed | [transaction](https://explorer-studio.genlayer.com/tx/0x61f723c477b642736cc2a7427027c22d64edcb674bcdba2985b75d291f619a6a) |
| tie-archive | 0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42 | FINALIZED | SUCCESS | MAJORITY_AGREE | Committed | [transaction](https://explorer-studio.genlayer.com/tx/0xc7ff7a08e1bf0788eedb7b45ab391d54490c5af65482f75d03b6503c21465fbf) |
| tie-beacon | 0x34346773a22564cbcc5F1D67D1c1F9f196DaEA35 | FINALIZED | SUCCESS | MAJORITY_AGREE | Committed | [transaction](https://explorer-studio.genlayer.com/tx/0xdabe32f18b901217b658b348fdba188f687ae9303ac0fd1be86999a1af093d4d) |
| tie-canopy | 0x5585Ea8f2FCC126bad0830EB9701E19b3CD800D5 | FINALIZED | SUCCESS | MAJORITY_AGREE | Committed | [transaction](https://explorer-studio.genlayer.com/tx/0xdc517265442b5acef82a099516258a0d9aed011eb3c85f8432fdd0ad37ca5a95) |
| finalize-tie | 0x5585Ea8f2FCC126bad0830EB9701E19b3CD800D5 | FINALIZED | SUCCESS | MAJORITY_AGREE | Committed | [transaction](https://explorer-studio.genlayer.com/tx/0x5a89312f1dccb38e549da65b423205f4c4a04d77892713ad761c7ca46b8c0f3b) |
| deadline-ballot | 0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42 | FINALIZED | ERROR | MAJORITY_AGREE | Expected guard rejection; no mutation | [transaction](https://explorer-studio.genlayer.com/tx/0xfd205b7cdbe24531c7d4652e21fe64fa804f4e8091cde60d2453f284509f360f) |
| finalize-incomplete | 0x5585Ea8f2FCC126bad0830EB9701E19b3CD800D5 | FINALIZED | SUCCESS | MAJORITY_AGREE | Committed | [transaction](https://explorer-studio.genlayer.com/tx/0xcaad190dd37c36264d071e22423e272e38165560b61474bd889410499fb8910b) |

## Adopted ballot observations

| Step | Voter | Revision | Status | Ranking |
| --- | --- | --- | --- | --- |
| source-held | 0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42 | 0 | HELD | — |
| unclear-revision | 0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42 | 1 | UNCLEAR | — |
| beacon-ballot | 0x34346773a22564cbcc5F1D67D1c1F9f196DaEA35 | 0 | RANKED | b → c → a |
| canopy-ballot | 0x5585Ea8f2FCC126bad0830EB9701E19b3CD800D5 | 0 | RANKED | c → b → a |
| corrected-archive | 0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42 | 2 | RANKED | a → b → c |
| tie-archive | 0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42 | 0 | RANKED | a → b → c |
| tie-beacon | 0x34346773a22564cbcc5F1D67D1c1F9f196DaEA35 | 0 | RANKED | b → c → a |
| tie-canopy | 0x5585Ea8f2FCC126bad0830EB9701E19b3CD800D5 | 0 | RANKED | c → b → a |

## Terminal outcomes

| Poll | Outcome | Candidate | Final root |
| --- | --- | --- | --- |
| expiry-v1 | INCOMPLETE | — | 182995cb321f121da0560b5c84b4c956c5ffd9773f4b11004c72d0e51e17e21f |
| transfer-v1 | ELECTED | b | 2da63cda63d1285feac8f1ba652b980abb4336a24268afaca4e000aaf071467d |
| tie-v1 | TIED_LAST | — | 44e7055a5d65662db0005f99d69011b669717867210467ad605457a316ef6fd1 |

### expiry-v1

Poll ID: `d918dfdcbf1307965fa80963e758ee970a556013245efdfef1c65452c9a45576`

Configuration root: `4da105972e2e8dde208af989e2c39f48825fb9fb0adfd3535dea1a5e7aabc9fd`

```json
{
  "rounds": [],
  "status": "INCOMPLETE",
  "unresolved": [
    "0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42",
    "0x34346773a22564cbcc5F1D67D1c1F9f196DaEA35",
    "0x5585Ea8f2FCC126bad0830EB9701E19b3CD800D5"
  ],
  "winner": ""
}
```

### transfer-v1

Poll ID: `b520646aaee2e6ecb12dbe97b961de3c8d43999bf89d62768250c8862b96c7cb`

Configuration root: `6b58c0edc744532efb8a9582520cfc316bb9ebda758128b8bbd98bd09b576b2e`

```json
{
  "rounds": [
    {
      "abstained_weight": 0,
      "active": [
        "a",
        "b",
        "c"
      ],
      "active_weight": 5,
      "allocations": [
        "a",
        "b",
        "c"
      ],
      "counts": [
        2,
        2,
        1
      ],
      "eliminated": "c",
      "exhausted_weight": 0,
      "majority": ""
    },
    {
      "abstained_weight": 0,
      "active": [
        "a",
        "b"
      ],
      "active_weight": 5,
      "allocations": [
        "a",
        "b",
        "b"
      ],
      "counts": [
        2,
        3
      ],
      "eliminated": "",
      "exhausted_weight": 0,
      "majority": "b"
    }
  ],
  "status": "ELECTED",
  "total_weight": 5,
  "winner": "b"
}
```

### tie-v1

Poll ID: `048a86c5a90f77a4979cb98c691ac2439eff81c4443988c20d377efb009780fa`

Configuration root: `20421825d61cd295ed9cc8320d224efb29a9769a54298f2d10bacac01c98c09d`

```json
{
  "rounds": [
    {
      "abstained_weight": 0,
      "active": [
        "a",
        "b",
        "c"
      ],
      "active_weight": 3,
      "allocations": [
        "a",
        "b",
        "c"
      ],
      "counts": [
        1,
        1,
        1
      ],
      "eliminated": "",
      "exhausted_weight": 0,
      "majority": ""
    }
  ],
  "status": "TIED_LAST",
  "total_weight": 3,
  "winner": ""
}
```

## Verification and limits

- GenVM lint and SDK validation pass. Runner is concretely pinned; the linter reports that a newer runner is available.
- 33 Python tests, 4 Node tests and 6 SDK calldata roundtrips pass. Python covers 10,125 partial-ranking/weight profiles against a separate set-based tally. Node covers another 1,000 triples with cursor-based weight transfers.
- Direct mode executes only the leader. Extracted callback tests confirm independent refetch and full ranking/status comparison, including changed fallback order with unchanged first choice. Mock post-consensus substitutions fail before storage writes.
- Every live committed cast uses actual web retrieval and model transcription. No mocked AI labels are sent onchain. Reports contain complete acquired bodies, hashes, bindings, rankings and immutable revision roots.
- Multi-signer transactions use three dedicated encrypted native test accounts. Keys, passwords, provider configuration and raw CLI logs are excluded.
- The same fixed panel weights are conserved each round. Exhaustion and abstention are separate; majority means continuing-weight majority, not original-panel majority. Tied last is deliberately terminal with no winner.
- HELD and UNCLEAR revisions are not usable abstentions. They supersede prior slots conservatively. An unresolved/absent member causes INCOMPLETE after deadline; no silent exclusion creates a winner.
- Finalization by a noncreator member demonstrates no owner veto. Source/hash/context/replay/terminal/deadline guards and root-bound consumer checks are labeled separately. ERROR receipts are rejection evidence, not successful business calls.
- Complete attempts and terminal roots were reread and independently reconstructed after negative tests. Wrong-root consumer rejection verified: true. No elected-candidate view is available for tied or incomplete polls.
- Fixed membership/weights are declared configuration, not proof of unique humans, stake or fair representation. Statements are adopted preferences, not external-world facts. Shared model errors and prompt injection remain risks. Ballots are public, not secret.
- No funds, graph mutations, capacity allocations, prediction accuracy scores, certificates or one-time rights are issued. Experimental; not for public elections, political governance or high-stakes use. No security audit, universal novelty or acceptance guarantee.

Sanitized receipts, complete source reports and immutable history: [PROOFS.json](PROOFS.json). Run `node scripts/verify-live.mjs` for wallet-free, read-only verification.
