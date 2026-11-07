"""Small real-model browser acceptance set; not a general model benchmark.

Requires Python Playwright/Chromium and an existing GGUF. SmolLM2 is evaluated
on simple English QA, Qwen2.5 additionally on Chinese step-by-step arithmetic.
All outputs and termination reasons are retained, including failed cases.
"""
import argparse
import functools
import http.server
import json
import re
from pathlib import Path
import threading

from playwright.sync_api import sync_playwright
from serve_web import Handler


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', required=True)
    ap.add_argument('--profile', choices=['smollm2', 'qwen2.5'], required=True)
    args = ap.parse_args()
    root = Path(__file__).resolve().parents[1]
    dest = root / 'web/dist/chat-quality' / args.profile
    dest.mkdir(parents=True, exist_ok=True)
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0),
        functools.partial(Handler, directory=str(root / 'web/dist')))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    cases = [('capital', 'What is the capital of France? Answer in one short sentence.', 'paris')]
    if args.profile == 'qwen2.5':
        cases.append(('arithmetic', '请逐步计算 1+2+3+4+5，每步列出累加结果，不要写代码。', '15'))
    results = []
    errors = []
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            try:
                page = browser.new_page()
                page.on('pageerror', lambda e: errors.append(str(e)))
                page.goto(f'http://127.0.0.1:{server.server_port}/')
                page.locator('#file').set_input_files(str(Path(args.model).resolve()))
                page.wait_for_function('!document.getElementById("run").disabled', timeout=120000)
                assert page.locator('#mode').input_value() == 'chat'
                hint = page.locator('#modelhint').inner_text()
                assert ('SmolLM2' if args.profile == 'smollm2' else 'Qwen2.5') in hint, hint
                page.locator('#maxnew').fill('128')
                page.locator('#temp').fill('0')
                for name, prompt, expected in cases:
                    page.locator('#prompt').fill(prompt)
                    page.locator('#run').click()
                    page.wait_for_function('!document.getElementById("run").disabled', timeout=240000)
                    output = page.locator('#out').inner_text()
                    reason = page.locator('#loadlog > div').last.inner_text()
                    passed = expected in output.lower() and 'numpy' not in output.lower() and '重复循环' not in reason
                    if name == 'arithmetic':
                        values = iter(map(int, re.findall(r'\d+', output)))
                        passed = passed and all(any(value == target for value in values) for target in [3, 6, 10, 15])
                    results.append({'case': name, 'prompt': prompt, 'output': output,
                                    'termination': reason, 'passed': passed})
                    page.screenshot(path=str(dest / (name + '.png')), full_page=True)
                # Exercise the non-greedy top-p path without assuming one answer string.
                page.locator('#prompt').fill('Say hello briefly.')
                page.locator('#maxnew').fill('8')
                page.locator('#temp').fill('0.7')
                page.locator('#run').click()
                page.wait_for_function('!document.getElementById("run").disabled', timeout=120000)
                assert page.locator('#out').inner_text().strip()
                assert 'token ids:' in page.locator('#tokids').inner_text()
                # Invalid numbers must be rejected, not silently defaulted.
                page.locator('#maxnew').fill('0')
                page.locator('#run').click()
                page.wait_for_function('!document.getElementById("run").disabled')
                assert '参数无效' in page.locator('#loadlog > div').last.inner_text()
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()
        report = {'profile': args.profile, 'cases': results, 'page_errors': errors,
                  'scope': 'small acceptance set, not proof of general reasoning accuracy'}
        (dest / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=True))
    assert results and all(x['passed'] for x in results) and not errors


if __name__ == '__main__':
    main()
