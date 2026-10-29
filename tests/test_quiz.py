import json
import re
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CONTRACT=(ROOT/'docs/CONTRACTS.md').read_text(encoding='utf-8')
START=CONTRACT.rfind('<!-- contratto-nodi:inizio -->')
NODES={n['id']:n for n in json.loads(CONTRACT[START:].split('```json',1)[1].split('```',1)[0])['nodi']}

class QuizBankTests(unittest.TestCase):
    def test_schema_and_minimum(self):
        schema=json.loads((ROOT/'schema/quiz.schema.json').read_text(encoding='utf-8'))
        self.assertFalse(schema['additionalProperties'])
        self.assertEqual(schema['properties']['elementi']['minItems'],60)
        data=json.loads((ROOT/'graph/quiz.json').read_text(encoding='utf-8'))
        self.assertGreaterEqual(len(data['elementi']),60)
        self.assertEqual(len({q['id'] for q in data['elementi']}),len(data['elementi']))
        self.assertTrue(all(q['nodo_id'] in NODES for q in data['elementi']))
        self.assertEqual({q['area'] for q in data['elementi']},set(range(1,8)))

    def test_m_i_p_theme_coverage(self):
        items=json.loads((ROOT/'graph/quiz.json').read_text(encoding='utf-8'))['elementi']
        themes={theme for item in items for theme in item['temi']}
        self.assertTrue({f'M{i}' for i in range(1,35)} <= themes)
        self.assertTrue({f'I{i}' for i in range(1,10)} <= themes)
        self.assertTrue({f'P{i}' for i in range(1,29)} <= themes)

    def test_distractors_and_answer_distribution(self):
        items=json.loads((ROOT/'graph/quiz.json').read_text(encoding='utf-8'))['elementi']
        multiple=[q for q in items if q['tipo']=='scelta_multipla']
        positions=[]
        for q in multiple:
            ids=[o['id'] for o in q['opzioni']]
            self.assertGreaterEqual(len(ids),3); self.assertLessEqual(len(ids),4)
            self.assertEqual(len(ids),len(set(ids)))
            self.assertIn(q['corretta'],ids)
            self.assertTrue(q['spiegazione'] and len(q['spiegazione'])>=40)
            for option in q['opzioni']:
                if option['id']!=q['corretta']:
                    self.assertGreaterEqual(len(option.get('perche_sbagliata','')),15)
                    self.assertIn('tema',option['perche_sbagliata'].lower())
            positions.append(q['corretta'])
        self.assertGreaterEqual(len(set(positions)),3)

    def test_completion_shape_and_pm_fm_key(self):
        data=json.loads((ROOT/'graph/quiz.json').read_text(encoding='utf-8'))
        for q in data['elementi']:
            self.assertGreaterEqual(len(q['spiegazione']),40)
            if q['tipo']=='completamento_formula':
                labels=re.findall(r'___(\d+)___',q['testo_con_buchi'])
                self.assertEqual(set(labels),set(q['soluzioni']))
                self.assertGreaterEqual(len(labels),1)
                self.assertTrue(all(values for values in q['soluzioni'].values()))
        pm=data['elementi'][6]
        self.assertEqual(pm['temi'],['M7'])
        self.assertIn('integratore',pm['spiegazione'].lower())
        self.assertIn('integratore',next(o['testo'].lower() for o in pm['opzioni'] if o['id']==pm['corretta']))
        fm=data['elementi'][7]
        self.assertEqual(fm['temi'],['M8'])
        self.assertIn('derivatore',fm['spiegazione'].lower())
        self.assertIn('derivatore',next(o['testo'].lower() for o in fm['opzioni'] if o['id']==fm['corretta']))
        ssb=next(q for q in data['elementi'] if q['temi']==['M1'])
        self.assertIn('NON TROVATO',ssb['spiegazione'])

    def test_text_safety_and_item_schema(self):
        schema=json.loads((ROOT/'schema/quiz.schema.json').read_text(encoding='utf-8'))
        self.assertEqual(schema['properties']['elementi']['items']['oneOf'].__len__(),3)
        text=(ROOT/'graph/quiz.json').read_text(encoding='utf-8')
        self.assertNotRegex(text,r'(?i)(?<!\w)(null|undefined|NaN)(?!\w)')
        for item in json.loads(text)['elementi']:
            self.assertTrue(item['id'].startswith('q-'))
            self.assertIn(item['tipo'],{'scelta_multipla','vero_falso','completamento_formula'})

if __name__=='__main__':unittest.main()
