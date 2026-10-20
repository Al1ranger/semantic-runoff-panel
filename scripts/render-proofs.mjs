import fs from 'node:fs';
const p=JSON.parse(fs.readFileSync('PROOFS.json','utf8'));
if(!p.final_readback_verified||p.transactions.some(t=>!t.verified||t.status!=='FINALIZED'))throw Error('Incomplete proofs');
const repo='https://github.com/Al1ranger/semantic-runoff-panel',explorer='https://explorer-studio.genlayer.com';
const lines=['# Live StudioNet proofs','',`Contract: [${p.address}](${explorer}/address/${p.address})`,'',
 `Source SHA-256: \`${p.source.sha256}\`. RPC code matches contracts/SemanticRunoffPanel.py after CRLF normalization.`,
 `Fixtures: [${p.fixture_commit}](${repo}/tree/${p.fixture_commit}/examples). Developer-authored preferences adopted by dedicated test signers, not evidence of real people voting.`,
 '', '## Transaction matrix', '', '| Case | Signer | Lifecycle | Execution | Consensus | Effect | Explorer |','| --- | --- | --- | --- | --- | --- | --- |'];
for(const t of p.transactions)lines.push(`| ${t.step} | ${t.signer} | ${t.status} | ${t.execution} | ${t.consensus} | ${t.committed?'Committed':'Expected guard rejection; no mutation'} | [transaction](${explorer}/tx/${t.hash}) |`);
lines.push('','## Adopted ballot observations','', '| Step | Voter | Revision | Status | Ranking |','| --- | --- | --- | --- | --- |');
for(const [name,o] of Object.entries(p.observations))lines.push(`| ${name} | ${o.voter} | ${o.slot.revision} | ${o.slot.status} | ${o.slot.ranking.join(' → ')||'—'} |`);
lines.push('','## Terminal outcomes','', '| Poll | Outcome | Candidate | Final root |','| --- | --- | --- | --- |');
for(const [name,r] of Object.entries(p.polls))lines.push(`| ${name} | ${r.status} | ${r.final.outcome.winner||'—'} | ${r.final.root} |`);
for(const [name,r] of Object.entries(p.polls))lines.push('',`### ${name}`,'',`Poll ID: \`${r.poll}\``,'',`Configuration root: \`${r.config_root}\``,'',
 '```json',JSON.stringify(r.final.outcome,null,2),'```');
lines.push('','## Verification and limits','',
 '- GenVM lint and SDK validation pass. Runner is concretely pinned; the linter reports that a newer runner is available.',
 '- 33 Python tests, 4 Node tests and 6 SDK calldata roundtrips pass. Python covers 10,125 partial-ranking/weight profiles against a separate set-based tally. Node covers another 1,000 triples with cursor-based weight transfers.',
 '- Direct mode executes only the leader. Extracted callback tests confirm independent refetch and full ranking/status comparison, including changed fallback order with unchanged first choice. Mock post-consensus substitutions fail before storage writes.',
 '- Every live committed cast uses actual web retrieval and model transcription. No mocked AI labels are sent onchain. Reports contain complete acquired bodies, hashes, bindings, rankings and immutable revision roots.',
 '- Multi-signer transactions use three dedicated encrypted native test accounts. Keys, passwords, provider configuration and raw CLI logs are excluded.',
 '- The same fixed panel weights are conserved each round. Exhaustion and abstention are separate; majority means continuing-weight majority, not original-panel majority. Tied last is deliberately terminal with no winner.',
 '- HELD and UNCLEAR revisions are not usable abstentions. They supersede prior slots conservatively. An unresolved/absent member causes INCOMPLETE after deadline; no silent exclusion creates a winner.',
 '- Finalization by a noncreator member demonstrates no owner veto. Source/hash/context/replay/terminal/deadline guards and root-bound consumer checks are labeled separately. ERROR receipts are rejection evidence, not successful business calls.',
 '- Complete attempts and terminal roots were reread and independently reconstructed after negative tests. Wrong-root consumer rejection verified: '+p.wrong_root_consumer_denied+'. No elected-candidate view is available for tied or incomplete polls.',
 '- Fixed membership/weights are declared configuration, not proof of unique humans, stake or fair representation. Statements are adopted preferences, not external-world facts. Shared model errors and prompt injection remain risks. Ballots are public, not secret.',
 '- No funds, graph mutations, capacity allocations, prediction accuracy scores, certificates or one-time rights are issued. Experimental; not for public elections, political governance or high-stakes use. No security audit, universal novelty or acceptance guarantee.',
 '', 'Sanitized receipts, complete source reports and immutable history: [PROOFS.json](PROOFS.json). Run `node scripts/verify-live.mjs` for wallet-free, read-only verification.','');
fs.writeFileSync('LIVE_PROOFS.md',lines.join('\n'));
const title='SemanticRunoffPanel — Source-Bound Transferable Preferences';
const outcomes=Object.entries(p.polls).map(([name,r])=>`${name}: ${r.status}${r.final.outcome.winner?' ('+r.final.outcome.winner+')':''}`).join('; ');
const description=`SemanticRunoffPanel transcribes source-bound preferences for a fixed weighted panel. Each member signs adoption of exact published bytes. Validators independently fetch the pinned document, verify SHA-256/schema and reproduce every rank or abstention. Exact report equality is required; models do not pick winners.\n\nMember-only revisions preserve immutable attempts. HELD/UNCLEAR cannot count as abstention. Anyone can finalize a complete panel; unresolved panels close INCOMPLETE after deadline. Runoff transfers fixed weight once per round, accounts for exhaustion and stops on tied last. Only ELECTED enables a root-bound result view.\n\nLive StudioNet: ${outcomes}. 33 Python + 4 Node tests; 6 SDK roundtrips. Matching source and multi-signer proofs included.\n\nPublic adopted preferences—not verified human identity or external facts. No funds or execution rights.`;
if(title.length>80||description.length>1000)throw Error('Submission length limit');
const evidence=[repo,repo+'/blob/main/contracts/SemanticRunoffPanel.py',repo+'/blob/main/README.md',repo+'/blob/main/LIVE_PROOFS.md',explorer+'/address/'+p.address,...p.transactions.map(t=>explorer+'/tx/'+t.hash)];
fs.writeFileSync('SUBMISSION.md',`Contribution type: Builder → Intelligent Contracts\n\nTitle:\n${title}\n\nNotes / Description (${description.length}/1000):\n\n${description}\n\nEvidence URLs:\n\n${evidence.map(x=>'- '+x).join('\n')}\n`);
console.log(JSON.stringify({proofs:p.transactions.length,title_chars:title.length,description_chars:description.length}));
