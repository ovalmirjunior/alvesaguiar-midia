# Checks the kit tree. Exit 0 only when everything matches. Python standard library only.
# usage: python3 -I kit_check.py [--version v1]            verify
#        python3 -I kit_check.py --write-manifest v1        (re)write v1/MANIFEST.sha256 and the KIT.pin files under v1 (only before FROZEN exists)
# Checks: tools/COPIES.sha256 (names relative to tools/); the MANIFEST.sha256 of every version (or the named one): every line matches the file on disk,
# and no file under the version folder is missing from the manifest (MANIFEST.sha256, FROZEN and KIT.pin are the only exceptions);
# every KIT.pin under a version folder names that version and the sha256 of its MANIFEST.sha256.
# Prints one JSON line.
import hashlib, json, os, re, sys

KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXEMPT = {'MANIFEST.sha256', 'FROZEN', 'KIT.pin'}
# files a version loads outside its own folder (used only when writing a manifest)
LOADS = {'v1': ['vendor/three-0.169.0/build/three.module.js', 'assets/fonts/f1', 'assets/textures/t1']}


def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def walk(root):
    for d, _, fs in os.walk(root):
        for n in fs:
            yield os.path.join(d, n)


def read_lines(path):
    with open(path, encoding='utf-8') as f:
        return [l.rstrip('\n') for l in f if l.strip()]


def parse(line):
    m = re.match(r'^([0-9a-f]{64}) [ *](.+)$', line)
    return (m.group(1), m.group(2)) if m else None


def versions():
    return sorted(d for d in os.listdir(KIT) if re.fullmatch(r'v\d+', d) and os.path.isdir(os.path.join(KIT, d)))


def manifest_files(v):
    out = []
    for p in walk(os.path.join(KIT, v)):
        if os.path.basename(p) not in EXEMPT:
            out.append(os.path.relpath(p, KIT))
    for e in LOADS.get(v, []):
        p = os.path.join(KIT, e)
        if os.path.isdir(p):
            out += [os.path.relpath(q, KIT) for q in walk(p)]
        else:
            out.append(e)
    return sorted(set(out))


def write_manifest(v):
    if os.path.exists(os.path.join(KIT, v, 'FROZEN')):
        print(json.dumps({'error': v + ' is FROZEN'})); return 2
    mf = os.path.join(KIT, v, 'MANIFEST.sha256')
    with open(mf, 'w', encoding='utf-8') as f:
        for rel in manifest_files(v):
            f.write('%s  %s\n' % (sha(os.path.join(KIT, rel)), rel))
    msha = sha(mf)
    pins = []
    for p in walk(os.path.join(KIT, v)):
        if os.path.basename(p) == 'KIT.pin':
            with open(p, 'w', encoding='utf-8') as f:
                f.write('%s %s\n' % (v, msha))
            pins.append(os.path.relpath(p, KIT))
    print(json.dumps({'manifest': mf, 'sha256': msha, 'pins': pins}))
    return 0


def check(only):
    bad = []
    n_copies = 0
    cp = os.path.join(KIT, 'tools', 'COPIES.sha256')
    if not os.path.exists(cp):
        bad.append('missing tools/COPIES.sha256')
    else:
        for line in read_lines(cp):
            r = parse(line)
            if not r:
                bad.append('bad COPIES line: ' + line); continue
            f = os.path.join(KIT, 'tools', r[1]); n_copies += 1
            if not os.path.exists(f) or sha(f) != r[0]:
                bad.append('COPIES mismatch: ' + r[1])
    n_files = 0
    checked = []
    pending = []
    for v in ([only] if only else versions()):
        vd = os.path.join(KIT, v); mf = os.path.join(vd, 'MANIFEST.sha256')
        if not os.path.isdir(vd):
            bad.append('no folder ' + v); continue
        if not os.path.exists(mf):
            if only:
                bad.append(v + ': no MANIFEST.sha256')
            else:
                pending.append(v)   # a version folder still being built has no manifest yet
            continue
        listed = set()
        for line in read_lines(mf):
            r = parse(line)
            if not r:
                bad.append(v + ': bad manifest line: ' + line); continue
            listed.add(r[1]); n_files += 1
            f = os.path.join(KIT, r[1])
            if not os.path.exists(f):
                bad.append(v + ': missing ' + r[1])
            elif sha(f) != r[0]:
                bad.append(v + ': sha256 mismatch ' + r[1])
        for p in walk(vd):
            rel = os.path.relpath(p, KIT)
            if os.path.basename(p) not in EXEMPT and rel not in listed:
                bad.append(v + ': file not in manifest ' + rel)
        msha = sha(mf)
        for p in walk(vd):
            if os.path.basename(p) == 'KIT.pin':
                parts = open(p, encoding='utf-8').read().split()
                if parts != [v, msha]:
                    bad.append(v + ': KIT.pin does not match the manifest: ' + os.path.relpath(p, KIT))
        checked.append(v)
    print(json.dumps({'ok': not bad, 'versions': checked, 'pending': pending, 'copies': n_copies, 'manifest_files': n_files, 'bad': bad[:40]}))
    return 0 if not bad else 1


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['--write-manifest'] and len(a) == 2:
        sys.exit(write_manifest(a[1]))
    only = a[1] if a[:1] == ['--version'] and len(a) == 2 else None
    sys.exit(check(only))
