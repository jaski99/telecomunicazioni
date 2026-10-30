"""Verifiche dei 14 nodi W4 e dei relativi contenuti."""
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IDS = {'dim-pm-fm-trasformazione', 'dim-formula-carson',
       'dim-quadripoli-passa-basso-equivalente', 'dim-conversione-ad', 'dim-conversione-da',
       'dim-spettri-modulazione-prodotto', 'dim-modulazione-prodotto-qam-errore-fase'}
CONCETTI = {'conversione-ad-quantizzazione-pcm', 'collegamento-numerico-tdm-pcm',
            'segnali-passa-banda-inviluppo-complesso', 'modulazione-prodotto-dsb-ssb',
            'demodulazione-coerente-non-coerente', 'modulazioni-angolo-pm-fm',
            'modulazioni-numeriche'}

def load(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))

def contract():
    text = (ROOT / 'docs/CONTRACTS.md').read_text(encoding='utf-8')
    block = text.split('<!-- contratto-nodi:inizio -->', 1)[1].split('```json', 1)[1].split('```', 1)[0]
    return {n['id']: n for n in json.loads(block)['nodi']}

def test_nodes_contract():
    nodes = load('graph/parts/area-4.json') + load('graph/parts/area-5.json')
    assert {n['id'] for n in nodes} == IDS | CONCETTI
    assert IDS | CONCETTI == {id for id, n in contract().items() if n['worker'] == 'W4'}
    for node in nodes:
        ref = contract()[node['id']]
        for key in ('area', 'tipo', 'gruppo', 'worker'):
            assert node[key] == ref[key]
        assert {p['id'] for p in node['prerequisiti'] if p['forza'] == 'hard'} >= set(ref['prerequisiti_hard'])
        assert len(node['sapere']) >= 40
        assert 5 <= node['tempo_studio_min'] <= 600
        assert node['risorse'] == []

def test_demos_structure():
    for id in IDS:
        d = load(f'graph/dimostrazioni/{id}.json')
        assert d['id'] == id
        assert d['domande_esame'] == contract()[id]['domande_esame']
        assert len(d['enunciato']) >= 40 and d['ipotesi'] and len(d['notazione']) >= 2
        assert 20 <= len(d['idea']) <= 200 and 300 <= len(d['a_voce']) <= 1500
        assert len(d['passi']) >= 4 and [s['n'] for s in d['passi']] == list(range(1, len(d['passi'])+1))
        assert all(s['formula'] and len(s['perche']) >= 15 for s in d['passi'])
        assert d['formula_finale'] and len(d['errori_frequenti']) >= 2
        assert 3 <= len(d['versione_compatta']) <= 8 and 3 <= len(d['richiamo_attivo']) <= 5
        holes = re.findall(r'___(\d+)___', d['a_buchi']['testo'])
        assert holes == [str(i) for i in range(1, len(holes)+1)] and len(holes) >= 3
        assert set(holes) == set(d['a_buchi']['soluzioni'])
        assert all(d['a_buchi']['soluzioni'].values())
        assert d['verifica']['stato'] in {'ricostruzione_non_del_prof', 'verificata_file1_file3', 'da_verificare'}
        assert d['verifica']['punti_aperti']
        assert {f['chiave'] for f in d['fonti']} <= {'FILE1', 'FILE2', 'FILE3', 'RICOSTRUZIONE'}
        figure_ids = {f['id'] for f in d['figure']}
        assert figure_ids and all(s.get('figura', next(iter(figure_ids))) in figure_ids for s in d['passi'])
        for f in d['figure']:
            assert len(f['descrizione']) >= 30
            if f['tipo'] == 'blocchi':
                blocks = {b['id'] for b in f['blocchi']}
                assert len(blocks) >= 2 and all(c['da'] in blocks and c['a'] in blocks for c in f['collegamenti'])
            else:
                assert f['tipo'] == 'grafico'
                for axis in ('asse_x', 'asse_y'):
                    assert f[axis]['min'] < f[axis]['max']
                assert all(len(p) == 2 and all(isinstance(x, (int, float)) and math.isfinite(x) for x in p) for s in f['serie'] for p in s['punti'])

def test_text_and_delimiters():
    for path in ([ROOT / 'graph/dimostrazioni' / f'{id}.json' for id in IDS]
                 + [ROOT / 'graph/lezioni' / f'{id}.json' for id in CONCETTI]
                 + [ROOT / 'graph/parts/area-4.json', ROOT / 'graph/parts/area-5.json']):
        text = path.read_text(encoding='utf-8')
        assert not re.search(r"\b(?:null|undefined|NaN)\b|\b(?:perche|piu|gia|puo|e)'", text, re.I)
        assert text.count('$') % 2 == 0

def test_schema_dei_file_presenti():
    from scripts.caricamento import load_schema, validator_for

    nodes = load('graph/parts/area-4.json') + load('graph/parts/area-5.json')
    node_validator = validator_for(load_schema('node.schema.json'))
    dim_validator = validator_for(load_schema('dimostrazione.schema.json'))
    lesson_validator = validator_for(load_schema('lezione.schema.json'))
    for node in nodes:
        node_validator.validate(node)
        if node['tipo'] == 'dimostrazione':
            dim_validator.validate(load(f"graph/dimostrazioni/{node['id']}.json"))
        else:
            lesson_validator.validate(load(f"graph/lezioni/{node['id']}.json"))


def test_numeric_relations():
    # Integrazione numerica di m(t)=sin(t): confronto con le fasi prodotte
    # dalle due catene, includendo una fase iniziale diversa da zero.
    t0, t, kp, kf = 0.3, 1.1, 2.0, 3.0
    count = 4000
    dt = (t-t0)/count
    integrate = lambda f: dt * (0.5*f(t0) + sum(f(t0+i*dt) for i in range(1, count)) + 0.5*f(t))
    theta0 = kp*math.sin(t0)
    pm_after_integrator = kp * (kf/kp*integrate(math.sin) + theta0/kp)
    fm_phase = theta0 + kf*(math.cos(t0)-math.cos(t))
    assert math.isclose(pm_after_integrator, fm_phase, abs_tol=1e-7)
    fm_after_derivative = theta0 + kf*integrate(lambda x: kp/kf*math.cos(x))
    assert math.isclose(fm_after_derivative, kp*math.sin(t), abs_tol=1e-7)
    assert not math.isclose(fm_after_derivative-theta0, kp*math.sin(t), abs_tol=0.1)
    # Carson: 75 kHz deviazione e 15 kHz massima modulante: 180 kHz.
    deviation, highest_frequency = 75000, 15000
    bandwidth_hz = 2*(deviation + highest_frequency)
    assert bandwidth_hz == 180000
    assert math.isclose(2*(2*math.pi*deviation + 2*math.pi*highest_frequency),
                        2*math.pi*180000, rel_tol=1e-12)
    # Un tono d'inviluppo cos Ωt produce due righe RF a ω₀±Ω; una rete
    # con guadagni distinti le moltiplica separatamente.
    import cmath
    h_minus, h_plus = 0.4*cmath.exp(-0.2j), 0.9*cmath.exp(0.5j)
    input_coeff = 0.5
    output_i = { -1: h_minus*input_coeff, 1: h_plus*input_coeff }
    output_rf = { -1: h_minus*input_coeff/2, 1: h_plus*input_coeff/2 }
    assert all(abs(output_i[k]-2*output_rf[k]) < 1e-12 for k in (-1, 1))
    assert abs(h_minus - h_plus.conjugate()) > 0.1


def test_pcm_quantizzazione_e_ricostruzione():
    # Quantizzatore uniforme mid-rise a 4 livelli su [-1, 1), passo 0,5.
    levels = (-0.75, -0.25, 0.25, 0.75)
    values = (-0.9, -0.1, 0.2, 0.8)
    indices = [math.floor((x+1)/0.5) for x in values]
    encoded = [format(i, '02b') for i in indices]
    assert encoded == ['00', '01', '10', '11']
    decoded = [levels[int(word, 2)] for word in encoded]
    assert decoded == list(levels)
    assert all(abs(a-b) <= 0.25 for a,b in zip(decoded, values))
    assert decoded != list(values)
    # Frequenza 4 kHz: 8 kHz per 8 bit producono 64 kbit/s.
    assert 8000 * math.ceil(math.log2(256)) == 64000
    # L'equalizzatore annulla l'attenuazione del PAM ideale in banda.
    T, G, X = 0.125, 0.4+0.2j, 2-1j
    spectrum_after_filter = G/T*X
    assert abs(T/G*spectrum_after_filter-X) < 1e-12


def test_demodulazione_qam_numerica():
    # Media su periodi interi elimina i termini al doppio della portante.
    a, b, phase, samples = 0.7, -0.4, 0.37, 10000
    out1 = out2 = 0.0
    for n in range(samples):
        t = 2*math.pi*n/samples
        signal = a*math.cos(t)-b*math.sin(t)
        out1 += 2*signal*math.cos(t-phase)/samples
        out2 += -2*signal*math.sin(t-phase)/samples
    assert math.isclose(out1, a*math.cos(phase)-b*math.sin(phase), abs_tol=1e-12)
    assert math.isclose(out2, b*math.cos(phase)+a*math.sin(phase), abs_tol=1e-12)
    assert math.isclose(out1*out1+out2*out2, a*a+b*b, abs_tol=1e-12)


def test_spettro_prodotto_numerico():
    import cmath
    # Tono a fase positiva modulato per una portante: DFT diretta.
    samples, carrier, tone, phase = 256, 30, 5, 0.6
    signal = [math.cos(2*math.pi*tone*n/samples+phase)*math.cos(2*math.pi*carrier*n/samples) for n in range(samples)]
    def dft(k):
        return sum(x*cmath.exp(-2j*math.pi*k*n/samples) for n,x in enumerate(signal))/samples
    upper, lower = dft(carrier+tone), dft(carrier-tone)
    assert abs(upper-0.25*cmath.exp(1j*phase)) < 1e-12
    assert abs(lower-0.25*cmath.exp(-1j*phase)) < 1e-12


def test_lezioni_complete():
    for id in CONCETTI:
        lesson = load(f'graph/lezioni/{id}.json')
        assert lesson['id'] == id
        assert len(lesson['spiegazione']) >= 1200
        assert lesson['spiegazione'].count('### ') >= 2
        assert '$' in lesson['spiegazione']
        assert len(lesson['worked_example']['passi']) >= 3
        assert lesson['completion_problem']['passi_mancanti']
        assert len(lesson['errori_trappole']) >= 2
        assert 3 <= len(lesson['richiamo_attivo']['domande']) <= 5
        assert len(lesson['riepilogo'].splitlines()) <= 5
        assert lesson['checklist']['so_fare'] and lesson['checklist']['so_dire']


def test_latex_puro_e_delimitatori_lezioni():
    def strings(value):
        if isinstance(value, str):
            yield value
        elif isinstance(value, list):
            for item in value:
                yield from strings(item)
        elif isinstance(value, dict):
            for item in value.values():
                yield from strings(item)

    for id in IDS:
        dim = load(f'graph/dimostrazioni/{id}.json')
        formulas = [dim['formula_finale']] + [x['simbolo'] for x in dim['notazione']]
        formulas += [x['formula'] for x in dim['passi']]
        for formula in formulas:
            assert '$' not in formula
            assert formula.count('{') == formula.count('}'), formula
    for id in CONCETTI:
        lesson = load(f'graph/lezioni/{id}.json')
        for text in strings(lesson):
            assert text.count('$') % 2 == 0, text
            for formula in re.findall(r'\${1,2}(.*?)\${1,2}', text, re.S):
                assert formula.count('{') == formula.count('}'), formula


def test_nessun_testo_lungo_ripetuto_tra_file_w4():
    """Confronta interi valori testuali, non frammenti o riferimenti a ID."""
    from collections import defaultdict

    files = ([ROOT / 'graph/parts/area-4.json', ROOT / 'graph/parts/area-5.json']
             + [ROOT / 'graph/lezioni' / f'{id}.json' for id in CONCETTI]
             + [ROOT / 'graph/dimostrazioni' / f'{id}.json' for id in IDS])
    contract_ids = set(contract())
    occurrences = defaultdict(set)

    def visit(value, path, key=''):
        if isinstance(value, str):
            if len(value) > 30 and key != 'id' and value not in contract_ids:
                occurrences[value].add(str(path.relative_to(ROOT)))
        elif isinstance(value, dict):
            for k, item in value.items():
                visit(item, path, k)
        elif isinstance(value, list):
            for item in value:
                visit(item, path, key)

    for path in files:
        data = json.loads(path.read_text(encoding='utf-8'))
        if path.parent.name == 'parts':
            for node in data:
                # Ogni nodo è una sorgente distinta, anche nello stesso file part.
                visit(node, path / node['id'])
        else:
            visit(data, path)
    repeated = {value: sorted(paths) for value, paths in occurrences.items() if len(paths) > 1}
    assert not repeated, repeated


def test_enunciati_con_risultato():
    expected = {
        'dim-spettri-modulazione-prodotto': ('S(', 'X(', 'fase', 'inferiore'),
        'dim-conversione-ad': ('quantizza', 'PCM', 'omega_s', 'log_2'),
        'dim-conversione-da': ('S(', 'G(', 'equalizzatore', 'quantizzazione'),
        'dim-modulazione-prodotto-qam-errore-fase': ('cos', 'sin', 'Delta', 'ruotate'),
        'dim-quadripoli-passa-basso-equivalente': ('H_0', 'H(', 'I_r', 'geq', 'altrove', 'ne'),
        'dim-pm-fm-trasformazione': ('integratore', 'derivatore', 'PM', 'FM'),
        'dim-formula-carson': ('B_', 'Delta', 'omega_m', 'approx'),
    }
    for id, terms in expected.items():
        enunciato = load(f'graph/dimostrazioni/{id}.json')['enunciato']
        assert all(term in enunciato for term in terms), (id, enunciato)


def test_niente_punteggio_negli_enunciati_pm_fm_e_carson():
    for id in ('dim-pm-fm-trasformazione', 'dim-formula-carson'):
        assert 'Punteggio' not in load(f'graph/dimostrazioni/{id}.json')['enunciato']

# Round E: le eccezioni sono per correzione, non un permesso generale di
# cambiare l'intero contenuto. Lo snapshot è stato ricavato da main 0ef8a4c.
R6_EXCEPTIONS = {
    'dim-conversione-ad': {
        'T7-1': {'passi'}, 'T7-2': {'notazione'}, 'T7-3': {'passi', 'figure'},
        'T7-4': {'passi'}, 'T7-5': {'passi', 'figure'}, 'T7-6': {'passi'},
        'T7-7': {'verifica'}, 'S1-S8': {'passi', 'figure'},
        'G-5': {'a_voce', 'versione_compatta', 'a_buchi'}, 'G-6': {'collegamenti'},
    },
    'dim-conversione-da': {
        'T8-1': {'passi'}, 'T8-2': {'passi'}, 'T8-3': {'passi', 'varianti_notazione'},
        'T8-4': {'passi', 'figure'}, 'T8-5': {'passi'}, 'T8-6': {'richiamo_attivo'},
        'S1-S8': {'passi', 'figure'},
        'G-5': {'a_voce', 'versione_compatta', 'a_buchi'}, 'G-6': {'collegamenti'},
    },
    'dim-spettri-modulazione-prodotto': {
        'T6-1': {'passi'}, 'T6-2': {'formula_finale'}, 'T6-3': {'notazione'},
        'T6-4': {'errori_frequenti'}, 'T6-5': {'passi', 'figure'},
        'T6-6': {'a_voce', 'versione_compatta', 'a_buchi', 'richiamo_attivo'},
        'T6-7': {'verifica'}, 'S1-S8': {'passi', 'figure'}, 'G-6': {'collegamenti'},
    },
    'dim-modulazione-prodotto-qam-errore-fase': {
        'T10-1': {'passi'}, 'T10-2': {'passi'}, 'T10-3': {'passi', 'figure'},
        'T10-4': {'richiamo_attivo'}, 'T10-5': {'passi'}, 'T10-6': {'errori_frequenti'},
        'S1-S8': {'passi', 'figure'},
        'G-5': {'a_voce', 'versione_compatta', 'a_buchi'}, 'G-6': {'collegamenti'},
    },
    'dim-quadripoli-passa-basso-equivalente': {
        'T11-1': {'passi'}, 'T11-2': {'passi'}, 'T11-3': {'notazione'},
        'T11-4': {'verifica'}, 'T11-5': {'passi'}, 'T11-6': set(),
        'T11-7': {'passi', 'figure'}, 'T11-8': {'figure'}, 'S1-S8': {'passi', 'figure'},
        'G-5': {'a_voce', 'versione_compatta', 'a_buchi'},
    },
    'dim-pm-fm-trasformazione': {
        'T9-1': {'passi'}, 'T9-2': {'notazione'}, 'T9-3': {'passi'},
        'T9-4': {'richiamo_attivo'}, 'S1-S8': {'passi', 'figure'},
        'G-5': {'a_voce', 'versione_compatta', 'a_buchi'}, 'G-6': {'collegamenti'},
    },
    'dim-formula-carson': {
        'C-1': {'notazione'}, 'C-2': {'passi'}, 'C-3': {'passi'},
        'C-4': {'passi'}, 'C-5': {'verifica'}, 'C-6': {'varianti_notazione'},
        'S1-S8': {'passi', 'figure'},
        'G-5': {'a_voce', 'versione_compatta', 'a_buchi'}, 'G-6': {'collegamenti'},
    },
}
SNAPSHOT_SHA256 = {
    'dim-conversione-ad': '9c5e601b518fe7f4fcbecaf59e28b3c659c7b864041a4d6d4c8a9230c122bb61',
    'dim-conversione-da': '80999166e5e73f2817e35be0f127263ffc957cca26152a7412af1cece128983a',
    'dim-spettri-modulazione-prodotto': '59c82315f3003d01e487e75139f1074203c05f67d74ae14aa8d3f947c361adee',
    'dim-modulazione-prodotto-qam-errore-fase': '9598666f61a81793f784abd57254bc3b84e1e1076240e10ce92c78a559630a90',
    'dim-quadripoli-passa-basso-equivalente': '154adc5ca6a4b18c76b7148b8a309c79588519d65a71fe123ee3d769cea28144',
    'dim-pm-fm-trasformazione': 'd34c50363b17a74126f685ff04ec61565e04f07ebc7c96bef5546756ff10e046',
    'dim-formula-carson': 'c3f22fe47400701fc315495affd0999d9b3f4a6e54f9bdbc558470de8ae47597',
}


def test_e4_b7_snapshot_e_campi_invarianti():
    import hashlib

    snapshot = load('tests/fixtures/invarianti_w4.json')
    assert snapshot['commit'] == '0ef8a4c'
    assert set(snapshot['dimostrazioni']) == IDS == set(R6_EXCEPTIONS)
    for id, before in snapshot['dimostrazioni'].items():
        canonical = json.dumps(before, sort_keys=True, ensure_ascii=False,
                               separators=(',', ':')).encode('utf-8')
        assert hashlib.sha256(canonical).hexdigest() == SNAPSHOT_SHA256[id], id
        after = load(f'graph/dimostrazioni/{id}.json')
        allowed = set().union(*R6_EXCEPTIONS[id].values())
        assert set(before) <= set(after), id
        new_fields = set(after) - set(before)
        assert new_fields <= {'collegamenti', 'varianti_notazione'}, (id, new_fields)
        if 'varianti_notazione' in new_fields:
            assert id == 'dim-formula-carson'  # C-6, proprietà già prevista dallo schema
        for field in set(before) | set(after):
            if field not in allowed:
                assert after.get(field) == before.get(field), (id, field)
        for field in ('id', 'domande_esame', 'enunciato'):
            assert after[field] == before[field], (id, field)
        assert after['verifica']['stato'] != 'verificata_testo_prof'
        assert {f['id'] for f in before['figure']} <= {f['id'] for f in after['figure']}


def test_e4_b7_sottocampi_e_figure_non_oggetto_delle_correzioni():
    before = load('tests/fixtures/invarianti_w4.json')['dimostrazioni']
    # I diagrammi elencati conservano tutto salvo descrizione/titolo dello stato.
    description_only = {
        ('dim-conversione-ad', 'campionamento'): {'descrizione'},
        ('dim-conversione-da', 'catena'): {'descrizione'},
        ('dim-spettri-modulazione-prodotto', 'catena'): {'descrizione'},
        ('dim-quadripoli-passa-basso-equivalente', 'quadripoli'): {'descrizione'},
        ('dim-formula-carson', 'righe-carson'): {'titolo', 'descrizione'},
    }
    unchanged = {
        'dim-modulazione-prodotto-qam-errore-fase': {'catena', 'modulatore-qam', 'demodulatore-qam'},
        'dim-pm-fm-trasformazione': {'pm-verso-fm', 'fm-verso-pm'},
    }
    for (id, fig_id), allowed in description_only.items():
        old = next(f for f in before[id]['figure'] if f['id'] == fig_id)
        new = next(f for f in load(f'graph/dimostrazioni/{id}.json')['figure'] if f['id'] == fig_id)
        assert {k: v for k, v in old.items() if k not in allowed} == {
            k: v for k, v in new.items() if k not in allowed}, (id, fig_id)
    for id, ids in unchanged.items():
        after = load(f'graph/dimostrazioni/{id}.json')
        for fig_id in ids:
            old = next(f for f in before[id]['figure'] if f['id'] == fig_id)
            new = next(f for f in after['figure'] if f['id'] == fig_id)
            assert old == new, (id, fig_id)
    for id in ('dim-conversione-ad', 'dim-quadripoli-passa-basso-equivalente'):
        after = load(f'graph/dimostrazioni/{id}.json')
        for field in ('stato', 'data', 'note'):
            assert after['verifica'][field] == before[id]['verifica'][field], (id, field)
    for id in ('dim-conversione-ad', 'dim-pm-fm-trasformazione',
               'dim-quadripoli-passa-basso-equivalente'):
        after = load(f'graph/dimostrazioni/{id}.json')
        old_notation = before[id]['notazione']
        assert after['notazione'][:len(old_notation)] == old_notation


def figure_by_step(demo, n):
    step = demo['passi'][n - 1]
    assert step['n'] == n and step.get('figura')
    return next(f for f in demo['figure'] if f['id'] == step['figura'])


def within_axes(fig):
    if fig['tipo'] != 'grafico':
        return
    x, y = fig['asse_x'], fig['asse_y']
    for series in fig['serie']:
        for px, py in series['punti']:
            assert x['min'] <= px <= x['max'], (fig['id'], px)
            assert y['min'] <= py <= y['max'], (fig['id'], py)
    for point in fig.get('annotazioni', []):
        assert x['min'] <= point['x'] <= x['max'], fig['id']
        assert y['min'] <= point['y'] <= y['max'], fig['id']


def assert_progressive(previous, current):
    """S1-S5: stesso spazio, inclusione in testa, crescita e punti in scala."""
    assert previous['tipo'] == current['tipo'], (previous['id'], current['id'])
    within_axes(previous)
    within_axes(current)
    if previous['tipo'] == 'grafico':
        assert previous['asse_x'] == current['asse_x']
        assert previous['asse_y'] == current['asse_y']
        assert current['serie'][:len(previous['serie'])] == previous['serie']
        old = previous.get('annotazioni', [])
        new = current.get('annotazioni', [])
        assert all(item in new for item in old)
        assert len(current['serie']) > len(previous['serie']) or len(new) > len(old)
    elif previous['tipo'] == 'blocchi':
        blocks = {item['id']: item for item in current['blocchi']}
        for block in previous['blocchi']:
            assert blocks[block['id']] == block  # include colonna e riga
        assert all(link in current['collegamenti'] for link in previous['collegamenti'])
        assert (len(current['blocchi']) > len(previous['blocchi']) or
                len(current['collegamenti']) > len(previous['collegamenti']))
    else:
        assert previous['tipo'] == 'temporale'
        assert previous['asse_t'] == current['asse_t'] and previous['corsie'] == current['corsie']
        keys = ('intervalli', 'frecce', 'marcatori')
        assert all(item in current.get(key, []) for key in keys for item in previous.get(key, []))
        assert any(len(current.get(key, [])) > len(previous.get(key, [])) for key in keys)


def test_e4_b1_b2_catene_e_descrizioni():
    chains = {
        'dim-conversione-ad': (4, 5, 6),
        'dim-conversione-da': (4, 5),
        'dim-spettri-modulazione-prodotto': (7, 8, 9),
        'dim-modulazione-prodotto-qam-errore-fase': (7, 8),
        'dim-quadripoli-passa-basso-equivalente': (2, 3, 4),
        'dim-pm-fm-trasformazione': (1, 2),
        'dim-formula-carson': (3, 4, 5),
    }
    assert set(chains) == IDS  # una coppia progressiva in ciascuna scheda E4
    for id, steps in chains.items():
        demo = load(f'graph/dimostrazioni/{id}.json')
        assert list(steps) == list(range(steps[0], steps[-1] + 1))
        states = [figure_by_step(demo, n) for n in steps]
        for previous, current in zip(states, states[1:]):
            assert_progressive(previous, current)
        for fig in states:
            assert len(fig['descrizione']) >= 30
            assert not re.search(r'[ωΩβφϕΔε≥≤≈→±×²₀₁₂]', fig['descrizione']), fig['id']
            within_axes(fig)
    assert len(chains['dim-conversione-ad']) >= 3
    qam = load('graph/dimostrazioni/dim-modulazione-prodotto-qam-errore-fase.json')
    assert_progressive(figure_by_step(qam, 1), figure_by_step(qam, 2))


def test_e4_s6_nessuna_anticipazione_e_pannelli_t11():
    ad = load('graph/dimostrazioni/dim-conversione-ad.json')
    first = figure_by_step(ad, 1)
    assert [b['id'] for b in first['blocchi']] == ['b0', 'b1']
    assert figure_by_step(ad, 3)['id'] == 'caratteristica-quantizzatore'
    stage1, stage2, stage3 = [figure_by_step(ad, n) for n in (4, 5, 6)]
    assert stage1['blocchi'][:len(first['blocchi'])] == first['blocchi']
    assert [b['id'] for b in stage1['blocchi']] == ['b0', 'b1', 'campioni', 'b2', 'livelli']
    assert [b['id'] for b in stage2['blocchi']] == ['b0', 'b1', 'campioni', 'b2', 'livelli', 'b3']
    assert [b['id'] for b in stage3['blocchi']] == ['b0', 'b1', 'campioni', 'b2', 'livelli', 'b3', 'b4']
    assert 'codifica' not in str(stage1).lower()
    assert all(b['id'] != 'b4' for b in stage2['blocchi'])
    sp = load('graph/dimostrazioni/dim-spettri-modulazione-prodotto.json')
    upper, both = figure_by_step(sp, 7), figure_by_step(sp, 8)
    assert all('inferiore' not in s['etichetta'].lower() for s in upper['serie'])
    assert sum('inferiore' in s['etichetta'].lower() for s in both['serie']) == 2
    quad = load('graph/dimostrazioni/dim-quadripoli-passa-basso-equivalente.json')
    panels = [figure_by_step(quad, n) for n in (2, 3, 4, 5)]
    assert [p['id'] for p in panels] == ['bande-segnale', 'traslazione-spettrale',
                                        'spettro-equivalente', 'filtro-complesso-iq']
    assert all('banda base' not in s['etichetta'].lower() for p in panels[:2] for s in p['serie'])
    assert any('banda base' in s['etichetta'].lower() for s in panels[2]['serie'])
    assert panels[3]['tipo'] == 'blocchi'
    assert any(b['id'] == 'quadratura' and 'π/2' in b['etichetta'] for b in panels[3]['blocchi'])


def test_e4_b3_controllo_r6_7_3():
    non_digitabile = re.compile(r'[\\$^_]')
    all_nodes = set(contract())
    for id in IDS:
        demo = load(f'graph/dimostrazioni/{id}.json')
        figure_ids = {fig['id'] for fig in demo['figure']}
        used = [step['figura'] for step in demo['passi'] if step.get('figura')]
        assert len(figure_ids) == len(demo['figure'])
        assert set(used) == figure_ids, (id, figure_ids - set(used))
        assert len(used) == len(set(used)), id
        assert 4 <= len(demo['passi']) <= 12
        assert [step['n'] for step in demo['passi']] == list(range(1, len(demo['passi']) + 1))
        for step in demo['passi']:
            assert step.get('formula') or step.get('figura'), (id, step['n'])
            assert len(step['perche']) >= (60 if id == 'dim-spettri-modulazione-prodotto' else 40)
        for variants in demo['a_buchi']['soluzioni'].values():
            assert all(not non_digitabile.search(value) for value in variants), id
        assert 300 <= len(demo['a_voce']) <= 1500
        assert len(demo.get('collegamenti', [])) >= 2
        assert set(demo['collegamenti']) <= all_nodes
        for fig in demo['figure']:
            within_axes(fig)


def test_e4_b6_modulazione_prodotto_segno_e_numeri():
    demo = load('graph/dimostrazioni/dim-spettri-modulazione-prodotto.json')
    assert len(demo['passi']) == 10
    assert r'+\varphi' in demo['passi'][4]['formula']
    assert r'-\varphi' in demo['passi'][7]['formula']
    assert r'\varphi_s' in demo['formula_finale'] and r'\varphi_i' in demo['formula_finale']
    assert r'\phi(\Omega)' not in str(demo['notazione'])
    phi, t, wm, w0 = math.pi / 2, 0.1, 1, 10
    upper = 0.5 * math.cos((w0 + wm) * t - phi)
    lower = 0.5 * math.cos((w0 - wm) * t + phi)
    wrong_lower = 0.5 * math.cos((w0 - wm) * t - phi)
    reference = math.cos(wm * t - phi) * math.cos(w0 * t)
    assert math.isclose(upper + lower, reference, abs_tol=1e-12)
    assert round(reference, 3) == 0.054
    assert round(upper + wrong_lower, 3) == 0.837
    assert 'file1 p. 29' in demo['verifica']['note']


def test_e4_b6_conversione_ad_e_da():
    ad = load('graph/dimostrazioni/dim-conversione-ad.json')
    assert r'\ge 2\omega_m' in ad['passi'][0]['formula']
    assert r'\varepsilon_n=q_n-x_n' in ad['passi'][2]['formula']
    assert '(-M,M)' in ad['passi'][2]['testo']
    assert figure_by_step(ad, 3)['id'] == 'caratteristica-quantizzatore'
    levels, fs = 256, 8000
    bits = math.ceil(math.log2(levels))
    assert bits == 8 and bits * fs == 64000
    assert '64' in ad['passi'][-1]['testo'] and 'NON TROVATO' in ad['verifica']['punti_aperti'][-1]
    da = load('graph/dimostrazioni/dim-conversione-da.json')
    assert any('equalizzatrice' in p['testo'] and r'\frac{T}{G(\omega)}' in p['formula'] for p in da['passi'])
    assert any(r'\omega_s/2' in p['perche'] for p in da['passi'])
    assert any(r'\varepsilon(t)=x_r(t)-x(t)' in p['formula'] for p in da['passi'])
    gain = 1e-3 / 8e-6
    assert math.isclose(gain, 125, abs_tol=1e-12) and round(20 * math.log10(gain)) == 42
    assert '125' in str(da['richiamo_attivo'])


def test_e4_b6_qam_e_carson():
    demo = load('graph/dimostrazioni/dim-modulazione-prodotto-qam-errore-fase.json')
    phase = math.radians(10)
    c, s = math.cos(phase), math.sin(phase)
    assert round(c, 4) == 0.9848 and round(s, 4) == 0.1736
    assert round(20 * math.log10(s / c), 1) == -15.1
    assert '0{,}9848' in str(demo['richiamo_attivo'])
    assert '0{,}1736' in str(demo['richiamo_attivo'])
    assert '-15{,}1' in str(demo['richiamo_attivo'])
    assert any(r'\pi/2' in e['errore'] for e in demo['errori_frequenti'])
    carson = load('graph/dimostrazioni/dim-formula-carson.json')
    beta, fm_khz = 2, 1
    assert 2 * (beta + 1) * fm_khz == 6
    assert r'6\,\mathrm{kHz}' in carson['passi'][-1]['formula']
    assert carson['varianti_notazione'][0]['variante'] == 'NON TROVATO'
    assert 'stima, non un limite' in carson['passi'][3]['perche']


def test_e4_t11_6_simmetria_coniugata_con_tre_pulsazioni():
    import cmath

    demo = load('graph/dimostrazioni/dim-quadripoli-passa-basso-equivalente.json')
    beta = next(x for x in demo['notazione'] if x['simbolo'] == r'\beta(\omega)')
    assert r'\beta(\omega)=-\arg H(\omega)' in beta['significato']
    assert any(r'H_0(-\omega)\ne H_0^*(\omega)' in p['formula'] for p in demo['passi'])
    carrier = 10.0
    lowpass = lambda w: 1 / (1 + 1j * w)  # impulso reale, causale, stabile
    H = lambda w: lowpass(w - carrier)
    H0 = lambda w: H(w + carrier)
    for w in (0.25, 1.0, 2.5):
        assert abs(H0(w) - lowpass(w)) < 1e-12
        assert abs(H0(-w) - H0(w).conjugate()) < 1e-12
        assert abs(H(w - carrier) - lowpass(w)) > 0.1  # il segno opposto non funziona
        amplitude = 1 / (1 + w * w)
        h_plus = amplitude * cmath.exp(-1j * (0.3 * w))
        h_minus = amplitude * cmath.exp(-1j * (-0.3 * w))
        assert abs(h_minus - h_plus.conjugate()) < 1e-12
    assert 'causalità' in demo['passi'][-1]['perche']


def test_e4_katex_tutte_le_formule_pure():
    """Anche passi e simboli senza delimitatori devono compilare, non solo la prosa."""
    import subprocess

    entries = []
    for id in IDS:
        demo = load(f'graph/dimostrazioni/{id}.json')
        entries.append([id, demo['formula_finale']])
        entries.extend([id, p['formula']] for p in demo['passi'] if p.get('formula'))
        entries.extend([id, n['simbolo']] for n in demo['notazione'])
    javascript = """
import { compilaLatex } from './web/js/core/math.js';
let data = ''; for await (const chunk of process.stdin) data += chunk;
for (const [id, formula] of JSON.parse(data)) {
  try { compilaLatex(formula); }
  catch (error) { console.error(id + ': ' + formula + ' — ' + error.message); process.exitCode = 1; }
}
"""
    result = subprocess.run(['node', '--input-type=module', '-e', javascript],
                            input=json.dumps(entries), text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr
    assert len(entries) >= 100


def test_e4_etichette_nuove_figure_a_blocchi_non_spezzano_parole():
    """Gli stati nuovi restano leggibili anche col renderer attuale (B12)."""
    import subprocess

    targets = {
        'dim-conversione-ad': ('catena', 'catena-quantizzazione', 'catena-codifica',
                               'catena-segnale-numerico'),
        'dim-modulazione-prodotto-qam-errore-fase': ('demodulatore-dsb', 'demodulatore-dsb-filtrato'),
        'dim-quadripoli-passa-basso-equivalente': ('filtro-complesso-iq',),
    }
    entries = []
    for id, ids in targets.items():
        figures = {f['id']: f for f in load(f'graph/dimostrazioni/{id}.json')['figure']}
        entries.extend([id, figures[fig_id]] for fig_id in ids)
    javascript = r'''
import { renderBlocchi } from './web/js/figure/blocchi.js';
let data = ''; for await (const chunk of process.stdin) data += chunk;
const dec = s => s.replaceAll('&lt;', '<').replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"').replaceAll('&#039;', "'").replaceAll('&amp;', '&');
for (const [id, fig] of JSON.parse(data)) {
  const svg = renderBlocchi(fig).svgInner;
  for (const m of svg.matchAll(/<text\b[^>]*aria-label="([^"]*)"[^>]*>([\s\S]*?)<\/text>/g)) {
    const lines = [...m[2].matchAll(/<tspan\b[^>]*>([\s\S]*?)<\/tspan>/g)].map(x => dec(x[1]));
    const normalize = s => s.trim().replace(/\s+/g, ' ');
    if (lines.length && normalize(lines.join(' ')) !== normalize(dec(m[1]))) {
      console.error(`${id}/${fig.id}: ${dec(m[1])} → ${lines.join(' | ')}`); process.exitCode = 1;
    }
  }
}
'''
    result = subprocess.run(['node', '--input-type=module', '-e', javascript],
                            input=json.dumps(entries), text=True, capture_output=True, cwd=ROOT)
    assert len(entries) == 7
    assert result.returncode == 0, result.stderr
