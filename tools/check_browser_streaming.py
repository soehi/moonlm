"""Real-model browser regression: streaming, heartbeat, cancellation and reload.

Requires Python playwright and a Chromium installation. Builds web/dist first
with tools/serve_web.py --no-serve. Does not download models.
"""
import argparse
import functools
import http.server
import json
from pathlib import Path
import threading
import time

from playwright.sync_api import sync_playwright
from serve_web import Handler


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', required=True)
    ap.add_argument('--artifacts', default='web/dist/browser-check')
    args = ap.parse_args()
    root = Path(__file__).resolve().parents[1]
    output = Path(args.artifacts).resolve()
    output.mkdir(parents=True, exist_ok=True)
    handler = functools.partial(Handler, directory=str(root / 'web/dist'))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    errors = []
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            context = browser.new_context(record_video_dir=str(output))
            page = context.new_page()
            page.on('pageerror', lambda err: errors.append(str(err)))
            page.goto(f'http://127.0.0.1:{server.server_port}/')
            page.locator('#file').set_input_files(str(Path(args.model).resolve()))
            page.wait_for_function('!document.getElementById("run").disabled', timeout=120000)
            page.locator('#prompt').fill('The capital of France is')
            page.locator('#mode').select_option('raw')
            page.locator('#maxnew').fill('12')
            page.locator('#temp').fill('0')
            page.evaluate('''() => {
              window.samples = []; window.ticks = 0;
              setInterval(() => window.ticks++, 25);
              new MutationObserver(() => window.samples.push({
                time: performance.now(), ticks: window.ticks,
                count: Number(document.getElementById('m-tok').textContent),
                text: document.getElementById('out').textContent,
                running: document.getElementById('run').disabled,
                speed: document.getElementById('m-dec').textContent
              })).observe(document.getElementById('out'), {childList:true});
            }''')
            page.locator('#run').click()
            page.wait_for_function('window.samples.filter(x => x.count >= 3 && x.running).length > 0', timeout=120000)
            during = page.evaluate('window.samples')
            assert len({x['text'] for x in during if x['running']}) >= 3, during
            assert during[-1]['ticks'] > during[0]['ticks'], during
            assert during[-1]['speed'] != '—', during
            page.screenshot(path=str(output / 'during-generation.png'), full_page=True)
            start = time.monotonic()
            page.locator('#stop').click()
            page.wait_for_function('document.getElementById("b-model").textContent.includes("重新加载")')
            stopped = page.locator('#out').inner_text()
            page.wait_for_timeout(500)
            assert page.locator('#out').inner_text() == stopped
            assert page.locator('#run').is_disabled()
            assert time.monotonic() - start < 2
            page.locator('#file').set_input_files(str(Path(args.model).resolve()))
            page.wait_for_function('!document.getElementById("run").disabled', timeout=120000)
            page.locator('#maxnew').fill('8')
            page.locator('#run').click()
            page.wait_for_function('!document.getElementById("run").disabled', timeout=120000)
            ids = page.locator('#tokids').inner_text()
            assert ids.startswith('token ids: ') and len(ids.split()) > 3, ids
            # Compare worker output with the same compiled engine's direct API.
            # This is after responsiveness measurements, not part of the UI.
            reference = page.evaluate('''async () => {
              const e = await import('./web.js');
              const bytes = await document.getElementById('file').files[0].arrayBuffer();
              const h = e.moonlm_load(new Uint8Array(bytes), 'parity');
              if (h < 0) throw new Error(e.moonlm_last_error());
              const stats = e.moonlm_generate(h, 'The capital of France is', 8, 0, () => {});
              if (!stats.length) throw new Error(e.moonlm_last_error());
              const ids = Array.from(e.moonlm_last_tokens()); e.moonlm_free(h); return ids;
            }''')
            assert ids == 'token ids: ' + ' '.join(map(str, reference)), (ids, reference)
            assert not errors, errors
            report = {'stream_samples': during, 'stopped_text': stopped, 'final_ids': ids,
                      'worker_direct_parity': True, 'page_errors': errors}
            (output / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
            print(json.dumps({'stream_updates': len(during), 'worker_direct_parity': True,
                              'stop_and_reload': True, 'artifacts': str(output)}))
            context.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    main()
