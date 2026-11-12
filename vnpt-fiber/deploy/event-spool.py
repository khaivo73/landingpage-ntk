"""Filesystem-only event recovery. No network requests, including when idle."""
import json
import os
import pathlib
import time


def promote(root, now=None):
    now = time.time() if now is None else now
    root = pathlib.Path(root)
    count = 0
    for source in ('retry', 'pending'):
        for flag in (root / source).glob('*.json'):
            if source == 'pending':
                due = flag.stat().st_mtime + 180
            else:
                try:
                    due = json.loads(flag.read_text()).get('next_at', 0)
                except (ValueError, OSError):
                    due = 0
            if due <= now:
                try:
                    os.replace(flag, root / 'ready' / flag.name)
                    count += 1
                except FileNotFoundError:
                    pass
    return count


if __name__ == '__main__':
    promote(os.environ.get('VNPT_EVENTS_DIR', '/var/lib/vnpt-events'))
