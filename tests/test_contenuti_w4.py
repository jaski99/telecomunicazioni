"""Verifiche sulle schede W4 presenti; copertura W4 ancora parziale."""
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IDS = {'dim-pm-fm-trasformazione', 'dim-formula-carson',
       'dim-quadripoli-passa-basso-equivalente', 'dim-conversione-ad', 'dim-conversione-da',
       'dim-spettri-modulazione-prodotto', 'dim-modulazione-prodotto-qam-errore-fase'}

def load(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))

def contract():
    text = (ROOT / 'docs/CONTRACTS.md').read_text(encoding='utf-8')
    block = text.split('<!-- contratto-nodi:inizio -->', 1)[1].split('```json', 1)[1].split('```', 1)[0]
    return {n['id']: n for n in json.loads(block)['nodi']}

def test_nodes_contract():
    nodes = load('graph/parts/area-4.json') + load('graph/parts/area-5.json')
    assert {n['id'] for n in nodes} == IDS
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
    for path in list((ROOT / 'graph/dimostrazioni').glob('*.json')) + [ROOT / 'graph/parts/area-4.json', ROOT / 'graph/parts/area-5.json']:
        text = path.read_text(encoding='utf-8')
        assert not re.search(r"\b(?:null|undefined|NaN)\b|\b(?:perche|piu|gia|puo|e)'", text, re.I)
        assert text.count('$') % 2 == 0

def test_schema_dei_file_presenti():
    from scripts.caricamento import load_schema, validator_for

    nodes = load('graph/parts/area-4.json') + load('graph/parts/area-5.json')
    node_validator = validator_for(load_schema('node.schema.json'))
    dim_validator = validator_for(load_schema('dimostrazione.schema.json'))
    for node in nodes:
        node_validator.validate(node)
        dim_validator.validate(load(f"graph/dimostrazioni/{node['id']}.json"))


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
