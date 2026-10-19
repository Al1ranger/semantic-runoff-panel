import ast
import copy
import hashlib
import itertools
import json
from datetime import datetime
from pathlib import Path
import re
from types import SimpleNamespace
import pytest

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'contracts/SemanticRunoffPanel.py'
TREE = ast.parse(SOURCE.read_text())
HELPERS = [n for n in TREE.body if isinstance(n, (ast.FunctionDef, ast.Assign))]
NS = {'hashlib': hashlib, 'json': json, 're': re, 'datetime': datetime, 'Address': lambda x: x.lower()}
exec(compile(ast.Module(body=HELPERS, type_ignores=[]), str(SOURCE), 'exec'), NS)
SLATE = 'a:Archive|b:Beacon|c:Canopy'
COORD = 'Al1ranger/semantic-runoff-panel/' + 'a' * 40 + '/examples/archive.json'
CANDIDATES = NS['parse_slate'](SLATE)


def raw(name):
    return (ROOT / 'examples' / (name + '.json')).read_bytes()


def vote(weight, ranking=None, status='RANKED'):
    return {'weight': weight, 'status': status, 'ranking': ranking or []}


def test_transfer_changes_winner_without_minting_weight():
    votes = [vote(2, ['a', 'b', 'c']), vote(2, ['b', 'c', 'a']), vote(1, ['c', 'b', 'a'])]
    out = NS['runoff'](CANDIDATES, votes)
    assert out['status'] == 'ELECTED' and out['winner'] == 'b'
    assert out['rounds'][0]['counts'] == [2, 2, 1]
    assert out['rounds'][0]['eliminated'] == 'c'
    assert out['rounds'][1]['counts'] == [2, 3]
    for row in out['rounds']:
        assert row['active_weight'] + row['exhausted_weight'] + row['abstained_weight'] == 5


def test_tied_last_fails_closed_without_order_tiebreak():
    out = NS['runoff'](CANDIDATES, [vote(1, ['a']), vote(1, ['b']), vote(1, ['c'])])
    assert out['status'] == 'TIED_LAST' and out['winner'] == ''
    assert not out['rounds'][0]['eliminated']


def test_exhaustion_not_abstention_and_continuing_majority():
    out = NS['runoff'](CANDIDATES, [vote(3, ['a']), vote(2, ['b']), vote(1, ['c'])])
    assert out['status'] == 'ELECTED' and out['winner'] == 'a'
    assert out['rounds'][1]['exhausted_weight'] == 1
    assert out['rounds'][1]['active_weight'] == 5
    assert out['rounds'][1]['abstained_weight'] == 0


def test_all_abstain_has_no_winner():
    out = NS['runoff'](CANDIDATES, [vote(2, status='ABSTAIN'), vote(3, status='ABSTAIN')])
    assert out['status'] == 'NO_VOTES' and out['winner'] == ''
    assert out['rounds'][0]['abstained_weight'] == 5


def independent_irv(candidates, votes):
    alive = set(candidates)
    while alive:
        scores = {c: sum(v['weight'] for v in votes if next((r for r in v['ranking'] if r in alive), None) == c) for c in alive}
        total = sum(scores.values())
        if total == 0:
            return 'NO_VOTES', ''
        winner = [c for c in alive if scores[c] * 2 > total]
        if winner:
            return 'ELECTED', winner[0]
        last = [c for c in alive if scores[c] == min(scores.values())]
        if len(last) > 1:
            return 'TIED_LAST', ''
        alive -= set(last)


def test_exhaustive_three_member_rankings_and_weights():
    ranks = [list(p) for length in range(1, 4) for p in itertools.permutations('abc', length)]
    checked = 0
    for choices in itertools.product(range(len(ranks)), repeat=3):
        for weights in [(1, 1, 1), (2, 2, 1), (3, 2, 1)]:
            votes = [vote(w, ranks[r]) for w, r in zip(weights, choices)]
            out = NS['runoff'](CANDIDATES, votes)
            assert (out['status'], out['winner']) == independent_irv('abc', votes)
            assert len(out['rounds']) <= 3
            for row in out['rounds']:
                assert row['active_weight'] + row['exhausted_weight'] + row['abstained_weight'] == sum(weights)
            checked += 1
    assert checked == 10125


@pytest.mark.parametrize('ballot', [{'status': 'RANKED', 'ranking': []}, {'status': 'RANKED', 'ranking': ['a', 'a']},
 {'status': 'RANKED', 'ranking': ['x']}, {'status': 'ABSTAIN', 'ranking': ['a']}, {'status': 'UNCLEAR', 'ranking': ['a']},
 {'status': 'HELD', 'ranking': []}, {'status': 'RANKED', 'ranking': ['a'], 'confidence': 0.9}])
def test_ballot_schema(ballot):
    with pytest.raises(ValueError):
        NS['parse_ballot'](ballot, CANDIDATES)


def test_duplicate_json_keys():
    with pytest.raises(ValueError):
        NS['parse_ballot']('{"status":"RANKED","status":"ABSTAIN","ranking":[]}', CANDIDATES)


@pytest.mark.parametrize('slate', ['a:Archive|a:Beacon', 'a:Archive|b:archive', 'only:Archive', 'a:Arc|b:Bad:extra'])
def test_slate_rejected(slate):
    with pytest.raises(ValueError):
        NS['parse_slate'](slate)


def test_roster_bound_identity_and_weights():
    a, b = '0x' + '1' * 40, '0x' + '2' * 40
    assert NS['parse_roster'](a + ':2|' + b + ':1')[0]['weight'] == 2
    for roster in [a + ':2|' + a + ':1', a + ':0|' + b + ':1', a + ':101|' + b + ':1', '0x' + '0' * 40 + ':1|' + b + ':1']:
        with pytest.raises(ValueError):
            NS['parse_roster'](roster)


def report_data(name='archive', sha=None):
    body = raw(name)
    spec = NS['source_spec'](COORD, sha or hashlib.sha256(body).hexdigest())
    row = {'url': spec['url'], 'http': 200, 'body': body.decode(), 'hash': hashlib.sha256(body).hexdigest(),
           'status': 'OK' if hashlib.sha256(body).hexdigest() == spec['sha256'] else 'HASH_MISMATCH'}
    return spec, row


def test_context_and_source_reconstruction():
    spec, row = report_data()
    binding = {'poll': 'poll', 'voter': 'alice', 'revision': 0}
    report = {'binding': binding, 'source': row, 'document_status': 'READY', 'ballot': {'status': 'RANKED', 'ranking': ['a', 'b', 'c']}}
    assert NS['validate_report'](report, binding, spec, CANDIDATES)['ranking'] == ['a', 'b', 'c']
    for mutate in [lambda r: r['binding'].update(poll='other'), lambda r: r['binding'].update(voter='bob'),
                   lambda r: r['binding'].update(revision=1), lambda r: r['source'].update(body='{}'),
                   lambda r: r['source'].update(url='https://evil.test/')]:
        bad = copy.deepcopy(report)
        mutate(bad)
        with pytest.raises(ValueError):
            NS['validate_report'](bad, binding, spec, CANDIDATES)


def test_hash_failure_cannot_be_ranked_or_abstained():
    spec, row = report_data(sha='f' * 64)
    report = {'binding': {}, 'source': row, 'document_status': 'ACQUISITION_FAILED', 'ballot': {'status': 'HELD', 'ranking': []}}
    assert NS['validate_report'](report, {}, spec, CANDIDATES)['status'] == 'HELD'
    for status in ['ABSTAIN', 'UNCLEAR']:
        report['ballot']['status'] = status
        with pytest.raises(ValueError):
            NS['validate_report'](report, {}, spec, CANDIDATES)


def setup_poll(vm, deploy, accounts, duration=3600, nonce='demo'):
    contract = deploy(str(SOURCE))
    from genlayer import Address
    members = [Address(a) for a in accounts]
    vm.sender = members[0]
    warp(vm, '2026-10-19T12:00:00Z')
    roster = '|'.join(str(a) + ':' + str(w) for a, w in zip(members, [2, 2, 1]))
    poll = contract.open_poll(nonce, SLATE, roster, duration)
    return contract, poll, members


def warp(vm, timestamp):
    # gltest snapshots message_raw at deployment; synchronize only the test clock.
    from genlayer import gl
    vm.warp(timestamp)
    gl.message_raw['datetime'] = timestamp


def cast_mock(vm, contract, poll, sender, name, ranking=None, status='RANKED', revision=0, bad=False):
    vm.sender = sender
    vm.clear_mocks()
    body = raw(name)
    vm.mock_web(r'https://raw\.githubusercontent\.com/.*', {'response': {'status': 200, 'headers': {}, 'body': body}, 'method': 'GET'})
    vm.mock_llm(r'.*SEMANTIC RUNOFF BALLOT TRANSCRIPTION.*', json.dumps({'status': status, 'ranking': ranking or []}))
    return contract.cast(poll, revision, COORD, 'f' * 64 if bad else hashlib.sha256(body).hexdigest())


def test_direct_transfer_and_root_consumer(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    c, p, a = setup_poll(direct_vm, direct_deploy, [direct_alice, direct_bob, direct_charlie])
    for sender, name, ranking in zip(a, ['archive', 'beacon', 'canopy'], [['a','b','c'], ['b','c','a'], ['c','b','a']]):
        cast_mock(direct_vm, c, p, sender, name, ranking)
    c.finalize(p)
    final = c.get_poll(p)['final']
    assert final['outcome']['winner'] == 'b'
    assert c.winner(p, final['root'])['candidate']['id'] == 'b'
    with direct_vm.expect_revert('Final root mismatch'):
        c.winner(p, 'f' * 64)
    with direct_vm.expect_revert('Poll terminal'):
        c.finalize(p)
    with direct_vm.expect_revert('Poll terminal'):
        c.cast(p, 1, COORD, 'f' * 64)


def test_direct_revision_replay_and_immutable_history(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, p, a = setup_poll(direct_vm, direct_deploy, [direct_alice, direct_bob])
    first = cast_mock(direct_vm, c, p, a[0], 'archive', ['a','b','c'])
    original = c.get_attempt(first)
    with direct_vm.expect_revert('Revision mismatch'):
        c.cast(p, 0, COORD, 'f' * 64)
    held = cast_mock(direct_vm, c, p, a[0], 'archive', revision=1, bad=True)
    assert c.get_poll(p)['ballots'][str(a[0])]['status'] == 'HELD'
    assert c.get_attempt(first) == original
    assert c.get_attempt(held)['previous_attempt'] == first
    cast_mock(direct_vm, c, p, a[0], 'archive', ['a'], revision=2)
    with direct_vm.expect_revert('Ballot attempt limit'):
        c.cast(p, 3, COORD, 'f' * 64)


def test_direct_incomplete_deadline_no_veto(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    c, p, a = setup_poll(direct_vm, direct_deploy, [direct_alice, direct_bob], duration=60)
    cast_mock(direct_vm, c, p, a[0], 'archive', ['a'])
    from genlayer import Address
    direct_vm.sender = Address(direct_charlie)
    with direct_vm.expect_revert('Not a panel member'):
        c.cast(p, 0, COORD, 'f' * 64)
    with direct_vm.expect_revert('Panel incomplete before deadline'):
        c.finalize(p)
    warp(direct_vm, '2026-10-19T12:01:00Z')
    direct_vm.sender = a[1]
    with direct_vm.expect_revert('Ballot deadline passed'):
        c.cast(p, 0, COORD, 'f' * 64)
    direct_vm.sender = Address(direct_charlie)
    c.finalize(p)
    poll = c.get_poll(p)
    assert poll['status'] == 'INCOMPLETE'
    with direct_vm.expect_revert('No elected candidate'):
        c.winner(p, poll['final']['root'])


def test_direct_ambiguous_is_not_abstention(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, p, a = setup_poll(direct_vm, direct_deploy, [direct_alice, direct_bob], duration=60)
    cast_mock(direct_vm, c, p, a[0], 'unclear', status='UNCLEAR')
    cast_mock(direct_vm, c, p, a[1], 'abstain', status='ABSTAIN')
    with direct_vm.expect_revert('Panel incomplete before deadline'):
        c.finalize(p)
    warp(direct_vm, '2026-10-19T12:01:00Z')
    c.finalize(p)
    assert c.get_poll(p)['status'] == 'INCOMPLETE'


def test_direct_context_cannot_resolve_other_poll(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, p, a = setup_poll(direct_vm, direct_deploy, [direct_alice, direct_bob])
    roster = '|'.join(str(x) + ':1' for x in a)
    other = c.open_poll('another', SLATE, roster, 3600)
    cast_mock(direct_vm, c, p, a[0], 'archive', ['a'])
    assert c.get_poll(other)['ballots'] == {}
    with direct_vm.expect_revert('Panel incomplete before deadline'):
        c.finalize(other)


def test_validator_refetch_and_same_winner_different_ranking_rejected():
    cast = next(n for c in TREE.body if isinstance(c, ast.ClassDef) for n in c.body if isinstance(n, ast.FunctionDef) and n.name == 'cast')
    callbacks = [n for n in cast.body if isinstance(n, ast.FunctionDef)]
    spec, row = report_data()
    calls, ranking, binding = [], ['a','b','c'], {'poll': 'p', 'voter': 'a', 'revision': 0}
    class Returned:
        def __init__(self, calldata):
            self.calldata = calldata
    def web(url):
        calls.append(url)
        return SimpleNamespace(status=200, body=raw('archive'))
    def llm(*args, **kwargs):
        return {'status': 'RANKED', 'ranking': ranking}
    ns = dict(NS, spec=spec, binding=binding, candidates=CANDIDATES, gl=SimpleNamespace(vm=SimpleNamespace(Return=Returned), nondet=SimpleNamespace(web=SimpleNamespace(get=web), exec_prompt=llm)))
    exec(compile(ast.Module(body=HELPERS + callbacks, type_ignores=[]), str(SOURCE), 'exec'), ns)
    report = ns['observe']()
    assert ns['validator'](Returned(report)) and len(calls) == 2
    ranking = ['a','c','b']
    assert ns['validator'](Returned(report)) is False and len(calls) == 3
    bad = copy.deepcopy(report)
    bad['binding']['poll'] = 'other'
    assert ns['validator'](Returned(bad)) is False
    assert ns['validator'](object()) is False


@pytest.mark.parametrize('kind', ['voter', 'poll', 'body', 'document'])
def test_post_consensus_tampering_cannot_commit(direct_vm, direct_deploy, direct_alice, direct_bob, monkeypatch, kind):
    c, p, a = setup_poll(direct_vm, direct_deploy, [direct_alice, direct_bob])
    from genlayer import gl
    def forged(observe, validator):
        report = copy.deepcopy(observe())  # GenVM serializes the nondeterministic return.
        if kind in ('voter', 'poll'):
            report['binding'][kind] = 'other'
        elif kind == 'body':
            report['source']['body'] = '{}'
        else:
            report['document_status'] = 'INVALID_BALLOT'
        return report
    monkeypatch.setattr(gl.vm, 'run_nondet_unsafe', forged)
    with direct_vm.expect_revert('Invalid consensus report'):
        cast_mock(direct_vm, c, p, a[0], 'archive', ['a'])
    assert c.get_poll(p)['ballots'] == {}
    assert c.get_poll(p)['attempt_count'] == 0


def test_direct_bad_source_and_poll_parameters(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, p, a = setup_poll(direct_vm, direct_deploy, [direct_alice, direct_bob])
    with direct_vm.expect_revert('Invalid source specification'):
        c.cast(p, 0, COORD.replace('a' * 40, 'main'), 'f' * 64)
    with direct_vm.expect_revert('Poll nonce used'):
        c.open_poll('demo', SLATE, '|'.join(str(x) + ':1' for x in a), 3600)
    with direct_vm.expect_revert('Invalid poll parameters'):
        c.open_poll('invalid', SLATE, '|'.join(str(x) + ':1' for x in a), 59)
    with direct_vm.expect_revert('Invalid slate or roster'):
        c.open_poll('invalid', SLATE, str(a[0]) + ':1|' + str(a[0]) + ':2', 3600)


def test_direct_creator_bound(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, p, a = setup_poll(direct_vm, direct_deploy, [direct_alice, direct_bob])
    roster = '|'.join(str(x) + ':1' for x in a)
    for i in range(7):
        c.open_poll('extra_' + str(i), SLATE, roster, 3600)
    with direct_vm.expect_revert('Creator limit'):
        c.open_poll('ninth', SLATE, roster, 3600)


def test_direct_malformed_model_does_not_replace_slot(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, p, a = setup_poll(direct_vm, direct_deploy, [direct_alice, direct_bob])
    cast_mock(direct_vm, c, p, a[0], 'archive', ['a'])
    previous = c.get_poll(p)
    with direct_vm.expect_revert('Malformed ballot transcription'):
        cast_mock(direct_vm, c, p, a[0], 'archive', ['a', 'a'], revision=1)
    assert c.get_poll(p) == previous
