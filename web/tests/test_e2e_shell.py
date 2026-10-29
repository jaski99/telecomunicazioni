import pytest
from playwright.sync_api import sync_playwright
from e2e_helpers import VIEWPORTS, console_errors


@pytest.mark.parametrize('width,height', VIEWPORTS)
def test_a2_a15_shell(shell_server, width, height):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': width, 'height': height})
        errors = console_errors(page)
        page.goto(shell_server, wait_until='networkidle')
        assert page.locator('.brand').count() == 1
        assert page.locator('header').bounding_box()['height'] <= (64 if width < 768 else 72)
        assert page.locator('nav [aria-current=page]').count() == 1
        for selector in ['html', 'body', 'main', '.page']:
            assert page.locator(selector).first.evaluate("e => getComputedStyle(e).overflowX") not in ('hidden', 'clip')
        assert not errors
        browser.close()
