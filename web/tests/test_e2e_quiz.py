"""Browser end-to-end test for standalone quiz demo and #/quiz route (requires Playwright Chromium)."""
import os
import threading
import unittest
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from functools import partial
from playwright.sync_api import sync_playwright

WEB = Path(__file__).resolve().parents[1]


class QuizBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        handler = partial(SimpleHTTPRequestHandler, directory=str(WEB))
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f'http://127.0.0.1:{cls.server.server_port}'
        cls.url = f'{cls.base}/modules/quiz/demo.html'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=3)

    def _launch(self, p):
        options = {'headless': True}
        executable = os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE')
        if executable:
            options['executable_path'] = executable
            options['args'] = ['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote']
        return p.chromium.launch(**options)

    def test_training_simulation_and_responsive_layout(self):
        errors = []
        with sync_playwright() as p:
            browser = self._launch(p)
            page = browser.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
            page.goto(self.url, wait_until='networkidle')
            self.assertIn('domanda 1 di 3', page.locator('.quiz-status').inner_text())
            self.assertEqual(page.locator('.progress[role="progressbar"]').count(), 1)
            page.set_viewport_size({'width': 390, 'height': 844})
            heights = page.locator('label.quiz-option').evaluate_all('els => els.map(e => e.getBoundingClientRect().height)')
            self.assertTrue(heights and all(h >= 48 - 0.5 for h in heights), heights)
            page.locator('input[name="risposta"][value="a"]').check()
            page.get_by_role('button', name='Conferma risposta').click()
            self.assertTrue(page.get_by_text('Corretto.').is_visible())
            self.assertEqual(page.locator('.callout.callout--ok').count(), 1)
            self.assertLessEqual(page.locator('body').evaluate('(e)=>e.scrollWidth'), 390)
            sim_tab = page.get_by_role('tab', name='Simulazione')
            sim_tab.click()
            self.assertEqual(sim_tab.get_attribute('aria-selected'), 'true')
            page.locator('input[name="risposta"][value="a"]').check()
            page.get_by_role('button', name='Conferma risposta').click()
            page.get_by_role('button', name='Continua').click()
            page.locator('input[name="risposta"][value="b"]').check()
            page.get_by_role('button', name='Conferma risposta').click()
            page.get_by_role('button', name='Continua').click()
            page.get_by_label('Risposta 1').fill('ω²')
            page.get_by_role('button', name='Conferma risposta').click()
            page.get_by_role('button', name='Consegna simulazione').click()
            self.assertTrue(page.get_by_text('Simulazione completata').is_visible())
            page.set_viewport_size({'width': 1440, 'height': 900})
            self.assertLessEqual(page.locator('body').evaluate('(e)=>e.scrollWidth'), 1440)
            self.assertEqual(errors, [])
            browser.close()

    def test_app_quiz_route_renders_katex_and_saves_esito(self):
        errors = []
        with sync_playwright() as p:
            browser = self._launch(p)
            page = browser.new_page(viewport={'width': 390, 'height': 844})
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
            page.goto(f'{self.base}/index.html#/quiz', wait_until='networkidle')
            self.assertEqual(page.get_by_role('tab', name='Allenamento').get_attribute('aria-selected'), 'true')
            self.assertLessEqual(page.evaluate('document.documentElement.scrollWidth'), 390)
            first_radio = page.locator('input[name="risposta"]').first
            if first_radio.count() > 0:
                first_radio.check()
                page.get_by_role('button', name='Conferma risposta').click()
                saved = page.evaluate("() => JSON.parse(localStorage.getItem('tlc-kg:esiti-quiz:v1') || '[]').length")
                self.assertGreaterEqual(saved, 1)
            self.assertEqual(errors, [])
            browser.close()


if __name__ == '__main__':
    unittest.main()
