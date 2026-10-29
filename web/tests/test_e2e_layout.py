"""QA visivo e layout globale (worker D4) — criteri A1, A4, A11, A13, A14, A18, A19, A20, A21, A22.

Riutilizza web/tests/e2e_helpers.py (D1) su tutti i viewport obbligatori:
360x780, 390x844, 768x1024, 1440x900.
Salva gli screenshot a 390 e 1440 esclusivamente in /tmp/tlc-shots/.
"""

import re
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

from e2e_helpers import (
    VIEWPORTS,
    WEB,
    console_errors,
    contrasto,
    overflow_report,
    routes,
    tap_targets,
)

ALL_ROUTES = routes()
D4_ROUTES = [r for r in ALL_ROUTES if not r.startswith("dim/")]
SHOT_DIR = Path("/tmp/tlc-shots")

SHOT_TARGETS = [
    ("home", ""),
    ("grafo", "grafo"),
    ("esercizi", "esercizi"),
    ("quiz", "quiz"),
    ("ripasso", "ripasso"),
    ("fonti", "fonti"),
    ("nodo-campionamento", "nodo/dim-teorema-campionamento"),
    ("dim-campionamento", "dim/dim-teorema-campionamento"),
    ("dim-carson", "dim/dim-formula-carson"),
    ("dim-nascita-morte", "dim/dim-nascita-morte-equilibrio"),
]


@pytest.fixture(scope="module")
def layout_env(shell_server):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        sessions = {}
        try:
            for width, height in VIEWPORTS:
                ctx = browser.new_context(
                    viewport={"width": width, "height": height}, locale="it-IT"
                )
                page = ctx.new_page()
                errs = console_errors(page)
                page.goto(f"{shell_server}/index.html#/", wait_until="networkidle")
                sessions[(width, height)] = (ctx, page, errs)
            yield shell_server, browser, sessions
        finally:
            for ctx, _page, _errs in sessions.values():
                ctx.close()
            browser.close()


def apri_rotta(shell_server, page, errs, route):
    errs.clear()
    target = f"{shell_server}/index.html#/{route}" if route else f"{shell_server}/index.html#/"
    page.goto(target, wait_until="load")
    if route == "quiz":
        page.wait_for_selector("#quiz-root .quiz-form", timeout=5000)
    else:
        page.wait_for_selector("main h1", timeout=5000)
    page.wait_for_timeout(30)


@pytest.mark.parametrize("width,height", VIEWPORTS)
@pytest.mark.parametrize("route", ALL_ROUTES)
def test_a1_a4_a11_a13_a14_a19_a21_layout_globale(layout_env, width, height, route):
    shell_server, _browser, sessions = layout_env
    _ctx, page, errs = sessions[(width, height)]
    apri_rotta(shell_server, page, errs, route)

    # A1: nessuno scroll orizzontale della pagina né elementi fuori viewport fuori da .scroll-x
    ov = overflow_report(page)
    assert ov["width"] <= ov["viewport"] and not ov["elements"], (route, width, ov)

    # A4: nessun testo visibile in main sotto 14 px (escluse etichette SVG e sotto-elementi KaTeX)
    testi_piccoli = page.evaluate(
        """() => [...document.querySelectorAll('main *')]
          .filter(e => !e.closest('svg') && !e.closest('.katex') && e.getClientRects().length)
          .filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
          .map(e => ({cls: String(e.className), size: parseFloat(getComputedStyle(e).fontSize)}))
          .filter(x => x.size < 13.95)"""
    )
    assert not testi_piccoli, (route, width, testi_piccoli[:5])

    # A11 (struttura comune su tutte le rotte): gutter >= 16/24, padding .card/.step/.callout,
    # distanza verticale >= 16 px tra .card/.step impilate, nessuna sovrapposizione tra fratelli di layout
    dati_a11 = page.evaluate(
        """(w) => {
          const anomalie = [];
          const main = document.querySelector('main');
          const ms = getComputedStyle(main);
          const minGutter = w >= 768 ? 24 : 16;
          if (parseFloat(ms.paddingLeft) < minGutter - 0.5 || parseFloat(ms.paddingRight) < minGutter - 0.5) {
            anomalie.push(['gutter', ms.paddingLeft, ms.paddingRight]);
          }
          for (const el of main.querySelectorAll('.card, .step, .callout')) {
            if (!el.getClientRects().length || el.closest('.katex')) continue;
            const s = getComputedStyle(el);
            const req = (el.classList.contains('card') && w >= 1440) ? 24 : 16;
            for (const p of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']) {
              if (parseFloat(s[p]) < req - 0.5) {
                anomalie.push(['padding', el.className, p, parseFloat(s[p]), req]);
              }
            }
          }
          for (const parent of main.querySelectorAll('*')) {
            const kids = [...parent.children].filter(c =>
              (c.classList.contains('card') || c.classList.contains('step')) && c.getClientRects().length
            );
            for (let i = 0; i + 1 < kids.length; i++) {
              const a = kids[i].getBoundingClientRect();
              const b = kids[i + 1].getBoundingClientRect();
              if (b.top >= a.bottom - 1 && (b.top - a.bottom) < 15.5) {
                anomalie.push(['gap', parent.className, b.top - a.bottom]);
              }
            }
          }
          const ignora = e => e.closest('.katex, svg, .dim-controlli') || e.matches('.dim-controlli');
          const blocchi = new Set(['DIV', 'SECTION', 'ARTICLE', 'UL', 'OL', 'LI', 'TABLE', 'FIGURE', 'H1', 'H2', 'H3', 'P', 'DETAILS', 'FORM', 'ASIDE']);
          for (const parent of main.querySelectorAll('*')) {
            if (ignora(parent) || !parent.getClientRects().length) continue;
            const figli = [...parent.children].filter(c => blocchi.has(c.tagName) && c.getClientRects().length && !ignora(c));
            for (let i = 0; i < figli.length; i++) {
              const x = figli[i].getBoundingClientRect();
              for (let j = i + 1; j < figli.length; j++) {
                const y = figli[j].getBoundingClientRect();
                if (x.left < y.right - 1 && x.right > y.left + 1 && x.top < y.bottom - 1 && x.bottom > y.top + 1) {
                  anomalie.push(['overlap', figli[i].tagName, figli[j].tagName, parent.className]);
                }
              }
            }
          }
          return anomalie;
        }""",
        width,
    )
    assert not dati_a11, (route, width, dati_a11[:5])

    # A13: tap target >= 44x44 px fuori dai paragrafi
    piccoli_tap = [t for t in tap_targets(page) if t["width"] < 43.5 or t["height"] < 43.5]
    assert not piccoli_tap, (route, width, piccoli_tap[:5])

    # A14: contrasto WCAG >= 4.5:1 (>= 3:1 per testo grande >= 24 px o >= 18.66 px bold)
    campioni_colore = page.evaluate(
        """() => {
          function parseRgb(s) {
            const m = s && s.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
            if (!m) return null;
            return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])];
          }
          function sfondoEffettivo(el) {
            for (let a = el; a; a = a.parentElement) {
              const c = parseRgb(getComputedStyle(a).backgroundColor);
              if (c && c[3] > 0.05) return [c[0], c[1], c[2]];
            }
            return [255, 255, 255];
          }
          const out = [];
          for (const el of document.querySelectorAll('header *, nav *, main *, footer *')) {
            if (!el.getClientRects().length) continue;
            if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
            const s = getComputedStyle(el);
            if (s.visibility === 'hidden' || s.display === 'none') continue;
            const isSvg = el.namespaceURI && el.namespaceURI.includes('svg');
            const rawFg = isSvg && s.fill && s.fill.startsWith('rgb') ? s.fill : s.color;
            const fg = parseRgb(rawFg);
            if (!fg) continue;
            const fs = parseFloat(s.fontSize) || 16;
            const fw = parseInt(s.fontWeight, 10) || 400;
            const minRatio = (fs >= 24 || (fs >= 18.66 && fw >= 700)) ? 3.0 : 4.5;
            out.push({
              tag: el.tagName,
              txt: el.textContent.trim().slice(0, 32),
              fg: fg.slice(0, 3),
              bg: sfondoEffettivo(el),
              min: minRatio,
            });
          }
          return out;
        }"""
    )
    basso_contrasto = [
        (c["tag"], c["txt"], round(contrasto(c["fg"], c["bg"]), 2), c["min"])
        for c in campioni_colore
        if contrasto(c["fg"], c["bg"]) < c["min"] - 0.05
    ]
    assert not basso_contrasto, (route, width, basso_contrasto[:5])

    # A19: 0 errori console/pageerror/404 e nessun null/undefined/NaN visibile
    assert not errs, (route, width, errs)
    testo_sporco = page.evaluate(
        """() => {
          const m = document.querySelector('main').cloneNode(true);
          m.querySelectorAll('[hidden], .katex-mathml, script, style').forEach(e => e.remove());
          return m.textContent;
        }"""
    )
    assert not re.search(r"\b(null|undefined|NaN)\b|\[object Object\]", testo_sporco), (
        route,
        width,
    )

    # A21: ogni table visibile è dentro .scroll-x su >= 768 px e sostituita da .stack-list sotto 768 px
    violazioni_tabelle = page.evaluate(
        """(w) => {
          const visibili = [...document.querySelectorAll('main table')].filter(t => t.getClientRects().length);
          const out = [];
          for (const t of visibili) {
            if (w < 768) out.push(['table_visibile_mobile', t.className]);
            else if (!t.closest('.scroll-x')) out.push(['table_senza_scroll_x', t.className]);
          }
          return out;
        }""",
        width,
    )
    assert not violazioni_tabelle, (route, width, violazioni_tabelle)


@pytest.mark.parametrize("width,height", VIEWPORTS)
@pytest.mark.parametrize("route", D4_ROUTES)
def test_a11_formula_box_e_a18_pagine_d4(layout_env, width, height, route):
    shell_server, _browser, sessions = layout_env
    _ctx, page, errs = sessions[(width, height)]
    apri_rotta(shell_server, page, errs, route)

    # A11 (.formula-box padding >= 16 px sulle pagine D4)
    box_stretti = page.evaluate(
        """() => [...document.querySelectorAll('main .formula-box')]
          .filter(e => e.getClientRects().length)
          .map(e => {
            const s = getComputedStyle(e);
            return Math.min(
              parseFloat(s.paddingTop),
              parseFloat(s.paddingRight),
              parseFloat(s.paddingBottom),
              parseFloat(s.paddingLeft)
            );
          })
          .filter(v => v < 15.5)"""
    )
    assert not box_stretti, (route, width, box_stretti)

    # A18: nessun underscore dentro parole nel testo visibile né badge W1-W6
    anomalie_a18 = page.evaluate(
        """() => {
          const out = [];
          const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT, {
            acceptNode(n) {
              const el = n.parentElement;
              if (!el || el.closest('.katex') || el.closest('svg') || el.closest('a[href^="http"]')) {
                return NodeFilter.FILTER_REJECT;
              }
              const s = getComputedStyle(el);
              if (s.display === 'none' || s.visibility === 'hidden' || !el.getClientRects().length) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
          });
          let nodo;
          while ((nodo = walker.nextNode())) {
            const t = nodo.textContent;
            if (/[A-Za-zÀ-ÿ0-9]_[A-Za-zÀ-ÿ0-9]/.test(t)) {
              out.push(['underscore', t.trim().slice(0, 60)]);
            }
            if (/\\bW[1-6]\\b/.test(t) && nodo.parentElement.matches('.chip, .badge')) {
              out.push(['badge_worker', t.trim()]);
            }
          }
          return out;
        }"""
    )
    assert not anomalie_a18, (route, width, anomalie_a18)
    assert not errs, (route, width, errs)


@pytest.mark.parametrize("width,height", VIEWPORTS)
def test_a20_quiz_layout_e_feedback(layout_env, width, height):
    shell_server, browser, _sessions = layout_env
    ctx = browser.new_context(viewport={"width": width, "height": height}, locale="it-IT")
    try:
        page = ctx.new_page()
        errs = console_errors(page)
        page.goto(f"{shell_server}/index.html#/quiz", wait_until="networkidle")
        page.wait_for_selector("#quiz-root .quiz-form", timeout=5000)

        # Cerca la prima domanda con opzioni a scelta multipla (se la prima fosse completamento, scorre)
        for _ in range(10):
            if page.locator("label.quiz-option").count() >= 2:
                break
            page.locator(".quiz-form button[type='submit']").click()
            page.locator(".quiz-avanti").click()

        misure = page.evaluate(
            """() => {
              const lista = document.querySelector('.quiz-opzioni');
              const fw = lista.getBoundingClientRect().width;
              const opts = [...document.querySelectorAll('label.quiz-option')].map(o => {
                const r = o.getBoundingClientRect();
                return {top: r.top, width: r.width, height: r.height};
              });
              return {formWidth: fw, opts};
            }"""
        )
        opts = misure["opts"]
        assert len(opts) >= 2
        assert all(o["height"] >= 48 for o in opts), opts
        assert all(abs(o["width"] - misure["formWidth"]) <= 2 for o in opts), misure
        tops = [o["top"] for o in opts]
        assert all(tops[i + 1] > tops[i] + 40 for i in range(len(tops) - 1)), tops

        page.locator("label.quiz-option").first.click()
        page.locator(".quiz-form button[type='submit']").click()
        callout = page.locator("#quiz-root .callout.quiz-feedback")
        assert callout.count() == 1
        assert callout.is_visible()
        assert not errs
    finally:
        ctx.close()


@pytest.mark.parametrize("width,height", [(390, 844), (1440, 900)])
@pytest.mark.parametrize("slug,route", SHOT_TARGETS)
def test_a22_screenshot_pagine_e_dimostrazioni(layout_env, width, height, slug, route):
    SHOT_DIR.mkdir(parents=True, exist_ok=True)
    shell_server, _browser, sessions = layout_env
    _ctx, page, errs = sessions[(width, height)]
    apri_rotta(shell_server, page, errs, route)

    out_path = SHOT_DIR / f"{slug}-{width}x{height}.png"
    page.screenshot(path=str(out_path), full_page=False)
    assert out_path.is_file() and out_path.stat().st_size > 1000
    assert not errs, (slug, width, errs)

    repo_root = WEB.parent
    screenshot_nel_repo = [
        str(p.relative_to(repo_root))
        for p in repo_root.rglob("*.png")
        if p.name != "icon-512.png" and ".git" not in p.parts
    ]
    assert not screenshot_nel_repo, screenshot_nel_repo
