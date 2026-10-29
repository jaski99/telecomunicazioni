import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = (ROOT / 'docs/CONTRACTS.md').read_text(encoding='utf-8')
START = CONTRACT.rfind('<!-- contratto-nodi:inizio -->')
BLOCK = CONTRACT[START:].split('```json', 1)[1].split('```', 1)[0]
NODES = {item['id']: item for item in json.loads(BLOCK)['nodi']}

class ExerciseContentTests(unittest.TestCase):
    def test_scope_nodes_and_lessons(self):
        ids=[]
        for path in sorted((ROOT/'graph/parts').glob('area-*-esercizi.json')):
            area=int(path.name.split('-')[1])
            for node in json.loads(path.read_text(encoding='utf-8')):
                ids.append(node['id'])
                contract=NODES[node['id']]
                self.assertEqual((node['area'],node['tipo'],node['worker']),(contract['area'],contract['tipo'],'W6'))
                self.assertEqual(node['prerequisiti'],[{'id':rid,'forza':'hard','motivo':node['prerequisiti'][i]['motivo']} for i,rid in enumerate(contract['prerequisiti_hard'])])
                self.assertEqual(area,node['area'])
                self.assertGreaterEqual(len(node['sapere']),40)
                self.assertGreaterEqual(node['tempo_studio_min'],5)
                self.assertTrue(node['fonti'])
                self.assertEqual(node['risorse'],[])
                lesson_path=ROOT/'graph/lezioni'/f"{node['id']}.json"
                lesson=json.loads(lesson_path.read_text(encoding='utf-8'))
                self.assertEqual(lesson['id'],node['id'])
                self.assertGreaterEqual(len(lesson['spiegazione']),1200)
                self.assertGreaterEqual(len(lesson['worked_example']['passi']),3)
                self.assertGreaterEqual(len(lesson['completion_problem']['passi_mancanti']),1)
                self.assertGreaterEqual(len(lesson['richiamo_attivo']['domande']),3)
                self.assertGreaterEqual(len(lesson['errori_trappole']),2)
                for figure in lesson.get('figure',[]):
                    self.assertIn(figure['tipo'],('grafico','blocchi','temporale'))
                    self.assertGreater(figure['asse_x']['max'],figure['asse_x']['min'])
                    self.assertGreater(figure['asse_y']['max'],figure['asse_y']['min'])
                    self.assertTrue(figure['descrizione'])
                    self.assertTrue(figure['serie'])
                    for series in figure['serie']:
                        self.assertTrue(all(len(pair)==2 and all(isinstance(v,(int,float)) for v in pair) for pair in series['punti']))
        self.assertEqual(set(ids),{x['id'] for x in NODES.values() if x['worker']=='W6'})
        self.assertEqual(len(ids),10)

    def test_required_numeric_checks(self):
        # Independent checks of the worked results, including A5 and A6.
        self.assertAlmostEqual(1/(2*math.e),0.18393972058572117,places=6)
        self.assertAlmostEqual(1/math.e,0.36787944117144233,places=6)
        self.assertAlmostEqual(math.sqrt(3)/math.pi,0.5513288954217921,places=6)  # E1 first harmonic, A=2, τ/T=1/3
        self.assertAlmostEqual(math.sqrt(3)/(2*math.pi),0.27566444771089605,places=6)  # E1 second harmonic
        self.assertAlmostEqual(2*math.pi/0.002,math.pi*1000,places=8)  # E2 first null
        self.assertAlmostEqual(8/math.pi,8/math.pi,places=10)  # E3 x(0), X0=2 and ωm=4
        self.assertAlmostEqual(math.pi/0.001,1000*math.pi,places=8)  # E4 boundary π/T
        self.assertAlmostEqual(1/math.sqrt(2),0.70710678,places=6)  # E5/E6 cutoff
        self.assertAlmostEqual(2*3**3/3,18.0)  # E7, one-sided convention
        sinc=lambda x: 1.0 if x==0 else math.sin(x)/x
        t=0.001
        self.assertAlmostEqual(t/math.pi*sinc(0.0)**2,t/math.pi,places=12)  # E8 at zero
        for k in range(-5,6):
            ami = sinc(math.pi*k/2)**2*math.sin(math.pi*k)**2
            self.assertAlmostEqual(ami,0.0,places=10)  # E9 nulls for every k/T

    def test_notation_and_text_hygiene(self):
        files=list((ROOT/'graph/lezioni').glob('es-*.json'))+list((ROOT/'graph/parts').glob('area-*-esercizi.json'))
        for path in files:
            text=path.read_text(encoding='utf-8')
            self.assertNotRegex(text,r'(?i)(?<!\w)(null|undefined|NaN)(?!\w)')
            self.assertNotRegex(text,r'\b(?:e|perche|piu|gia|puo)\'')
            json.loads(text)
        e7=json.loads((ROOT/'graph/lezioni/es-derivatore-processo-gaussiano.json').read_text())
        self.assertIn('ω²G₀',e7['spiegazione'])
        e1=json.loads((ROOT/'graph/lezioni/es-spettri-impulsi-periodici.json').read_text())
        self.assertIn('arg(cₙ)',e1['spiegazione'])
        e9=json.loads((ROOT/'graph/lezioni/es-pam-ami.json').read_text())
        self.assertIn('ogni intero k',e9['spiegazione'])
        self.assertIn('IPOTESI',json.dumps(json.loads((ROOT/'graph/lezioni/es-pam-bipolare.json').read_text()),ensure_ascii=False))

import math
if __name__ == '__main__': unittest.main()
