import json
import re
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CONTRACT=(ROOT/'docs/CONTRACTS.md').read_text(encoding='utf-8')
START=CONTRACT.rfind('<!-- contratto-nodi:inizio -->')
NODES={n['id']:n for n in json.loads(CONTRACT[START:].split('```json',1)[1].split('```',1)[0])['nodi']}

class ExamMapTests(unittest.TestCase):
    def test_exam_schema_and_exact_id_coverage(self):
        schema=json.loads((ROOT/'schema/esame.schema.json').read_text(encoding='utf-8'))
        self.assertEqual(schema['$schema'],'https://json-schema.org/draft/2020-12/schema')
        self.assertFalse(schema['additionalProperties'])
        required=set(schema['required'])
        self.assertTrue({'versione','avvertenza','prove'} <= required)
        data=json.loads((ROOT/'graph/esame.json').read_text(encoding='utf-8'))
        expected={f'T{i}' for i in range(1,18)}|{f'E{i}' for i in range(1,10)}|{f'M{i}' for i in range(1,35)}|{f'I{i}' for i in range(1,10)}
        self.assertEqual(len(data['prove']),69)
        self.assertEqual({p['id'] for p in data['prove']},expected)
        self.assertEqual(len({p['id'] for p in data['prove']}),69)
        for proof in data['prove']:
            self.assertTrue(set(proof) == {'id','tipo','titolo','punti','nodi','fonte'})
            self.assertLessEqual(len(proof['titolo']),120)
            self.assertTrue(proof['nodi'])
            self.assertTrue(all(node in NODES for node in proof['nodi']))
            self.assertTrue(all(proof['id'] in NODES[node]['domande_esame'] for node in proof['nodi']))
            self.assertEqual(proof['fonte'],'FILE2')
            self.assertEqual(proof['punti'],10 if proof['id'] in {'T5','T11'} else 'NON TROVATO')
        self.assertEqual(data['avvertenza'],'Raccolta di studenti (file2), non prova ufficiale; frequenze e punteggi non indicati = NON TROVATO.')

    def test_kinds_correspond_to_id_prefixes(self):
        for p in json.loads((ROOT/'graph/esame.json').read_text())['prove']:
            expected={'T':'teoria','E':'esercizio','M':'quiz','I':'intro_reti'}[p['id'][0]]
            self.assertEqual(p['tipo'],expected)

if __name__=='__main__':unittest.main()
