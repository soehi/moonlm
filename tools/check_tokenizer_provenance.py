"""Verify embedded tables against the committed provenance manifest (stdlib only)."""
import ast
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def verify():
    manifest = json.loads((ROOT / 'third_party/tokenizer-data.json').read_text(encoding='utf-8'))
    for entry in manifest['fixtures']:
        text = (ROOT / entry['file']).read_text(encoding='utf-8')
        assert entry['upstream'] in text[:1000], entry['file']
        assert 'NOTICE' in text[:1000], entry['file']
        prefix = 'qwen2' if 'qwen2' in entry['file'] else 'golden'
        for table in ['vocab', 'merges']:
            values = []
            pattern = r'fn ' + prefix + '_' + table + r'_chunk_\d+\(\).*?\{(.*?)\n\}'
            for body in re.findall(pattern, text, re.S):
                for line in body.splitlines():
                    if line.strip().startswith('"'):
                        values.append(ast.literal_eval(line.strip().rstrip(',')))
            digest = hashlib.sha256(json.dumps(values, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
            assert len(values) == entry[table + '_count'], entry['file']
            assert digest == entry[table + '_sha256'], entry['file']
            if prefix == 'qwen2' and table == 'vocab':
                assert values[151665:] == [f'[PAD{i}]' for i in range(151665, 151936)]
        print(entry['file'] + ': counts, hashes, notices OK')
    assert 'Copyright 2024 Alibaba Cloud' in (ROOT / 'third_party/Qwen-LICENSE').read_text()
    assert (ROOT / 'LICENSE').is_file()


if __name__ == '__main__':
    verify()
