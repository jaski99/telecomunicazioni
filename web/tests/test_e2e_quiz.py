"""Browser end-to-end test for the standalone quiz demo (requires Playwright Chromium)."""
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
        handler=partial(SimpleHTTPRequestHandler,directory=str(WEB))
        cls.server=ThreadingHTTPServer(('127.0.0.1',0),handler)
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True)
        cls.thread.start()
        cls.url=f'http://127.0.0.1:{cls.server.server_port}/modules/quiz/demo.html'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown(); cls.server.server_close(); cls.thread.join(timeout=3)

    def test_training_simulation_and_responsive_layout(self):
        errors=[]
        with sync_playwright() as p:
            options={'headless':True}
            executable=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE')
            if executable:
                options['executable_path']=executable
                options['args']=['--no-sandbox','--disable-dev-shm-usage','--no-zygote']
            browser=p.chromium.launch(**options)
            page=browser.new_page()
            page.on('pageerror',lambda error: errors.append(str(error)))
            page.on('console',lambda message: errors.append(message.text) if message.type=='error' else None)
            page.goto(self.url,wait_until='networkidle')
            self.assertIn('domanda 1 di 3',page.locator('.quiz-status').inner_text())
            page.set_viewport_size({'width':390,'height':844})
            page.locator('input[name="risposta"][value="a"]').check()
            page.get_by_role('button',name='Conferma risposta').click()
            self.assertTrue(page.get_by_text('Corretto.').is_visible())
            self.assertLessEqual(page.locator('body').evaluate('(e)=>e.scrollWidth'),390)
            page.get_by_role('button',name='Simulazione').click()
            page.locator('input[name="risposta"][value="a"]').check()
            page.get_by_role('button',name='Conferma risposta').click()
            page.get_by_role('button',name='Continua').click()
            page.locator('input[name="risposta"][value="b"]').check()
            page.get_by_role('button',name='Conferma risposta').click()
            page.get_by_role('button',name='Continua').click()
            page.get_by_label('Risposta 1').fill('ω²')
            page.get_by_role('button',name='Conferma risposta').click()
            page.get_by_role('button',name='Consegna simulazione').click()
            self.assertTrue(page.get_by_text('Simulazione completata').is_visible())
            page.set_viewport_size({'width':1440,'height':900})
            self.assertLessEqual(page.locator('body').evaluate('(e)=>e.scrollWidth'),1440)
            self.assertEqual(errors,[])
            browser.close()

if __name__=='__main__':unittest.main()
