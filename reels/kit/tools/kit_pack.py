# Writes a self-contained bundle: the labrig files plus kit/ with only the files of the pinned manifest, and one MANIFEST.sha256 for the bundle.
# A plain file server at the bundle root serves the page (the page asks for /kit/... and files beside it).
# usage: python3 -I kit_pack.py <labrig> <bundle> [--page mesa.html]
# Refuses an existing bundle folder. Python standard library only. Prints one JSON line; exit 0 on success.
import hashlib, json, os, re, shutil, sys

KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def fail(msg, code=3):
    print(json.dumps({'error': msg})); sys.exit(code)


def main():
    a = sys.argv[1:]
    page = 'mesa.html'
    if '--page' in a:
        i = a.index('--page'); page = a[i + 1]; del a[i:i + 2]
    if len(a) != 2:
        fail('usage: kit_pack.py <labrig> <bundle> [--page p]', 2)
    labrig, bundle = os.path.abspath(a[0]), os.path.abspath(a[1])
    if os.path.exists(bundle):
        fail('bundle folder exists: ' + bundle, 2)
    pin_f, page_f = os.path.join(labrig, 'KIT.pin'), os.path.join(labrig, page)
    if not os.path.exists(pin_f) or not os.path.exists(page_f):
        fail('pin check: KIT.pin or ' + page + ' missing in ' + labrig)
    pin = open(pin_f, encoding='utf-8').read().split()
    m = re.search(r'/kit/(v\d+)/', open(page_f, encoding='utf-8').read())
    if len(pin) != 2 or not m or m.group(1) != pin[0]:
        fail('pin check: version of KIT.pin and of the import map differ')
    mf = os.path.join(KIT, pin[0], 'MANIFEST.sha256')
    if not os.path.exists(mf) or sha(mf) != pin[1]:
        fail('pin check: sha256 of MANIFEST.sha256 differs from KIT.pin')
    files = []
    for line in open(mf, encoding='utf-8'):
        if not line.strip():
            continue
        r = re.match(r'^([0-9a-f]{64}) [ *](.+)$', line.rstrip('\n'))
        if not r:
            fail('bad manifest line: ' + line)
        src = os.path.join(KIT, r.group(2))
        if not os.path.exists(src) or sha(src) != r.group(1):
            fail('pin check: manifest mismatch ' + r.group(2))
        files.append(r.group(2))
    os.makedirs(bundle)
    n = 0
    for d, _, fs in os.walk(labrig):
        for f in fs:
            s = os.path.join(d, f); rel = os.path.relpath(s, labrig)
            t = os.path.join(bundle, rel); os.makedirs(os.path.dirname(t), exist_ok=True); shutil.copyfile(s, t); n += 1
    for rel in files + [pin[0] + '/MANIFEST.sha256']:
        t = os.path.join(bundle, 'kit', rel); os.makedirs(os.path.dirname(t), exist_ok=True); shutil.copyfile(os.path.join(KIT, rel), t); n += 1
    lines = []
    for d, _, fs in os.walk(bundle):
        for f in fs:
            s = os.path.join(d, f); lines.append((os.path.relpath(s, bundle), sha(s)))
    out = os.path.join(bundle, 'MANIFEST.sha256')
    with open(out, 'w', encoding='utf-8') as f:
        for rel, h in sorted(lines):
            f.write('%s  %s\n' % (h, rel))
    # verify what was written
    for line in open(out, encoding='utf-8'):
        h, rel = line.rstrip('\n').split('  ', 1)
        if sha(os.path.join(bundle, rel)) != h:
            fail('bundle verify failed ' + rel, 1)
    print(json.dumps({'ok': True, 'bundle': bundle, 'files': n, 'manifest': out, 'sha256': sha(out), 'version': pin[0]}))


main()
