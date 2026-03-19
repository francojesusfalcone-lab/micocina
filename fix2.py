import os, re

src = r'C:\Users\franc\OneDrive\Escritorio\micocina\src'

# Reemplazos masivos para consistencia de fondos
replacements = [
    # Barras de búsqueda y secciones que usan bg-white explícito
    ('bg-white border-b border-app',          'bg-surface border-b border-app'),
    ('className="bg-white border-b',          'className="bg-surface border-b'),
    # Cards con bg-white explicito 
    ('className="bg-white rounded-2xl',        'className="bg-card-color rounded-2xl'),
    ('className="card-hover w-full',           'className="card-hover w-full'),
    # Fondos de sección/lista white
    ('"bg-white overflow-hidden',              '"bg-card-color overflow-hidden'),
    ('"bg-white rounded-',                     '"bg-card-color rounded-'),
    # active states inconsistentes
    ('active:bg-surface-50 transition-colors text-left"',  'active:opacity-70 transition-opacity text-left"'),
    ('active:bg-surface-50"',                  'active:opacity-70"'),
    # Búsqueda en ProductsPage
    ('px-4 py-3 bg-white dark:bg-gray-900',   'px-4 py-3 bg-surface'),
    ('px-4 py-3 bg-surface border-b border-surface-200 dark:border-gray-800', 'px-4 py-3 bg-surface border-b border-app'),
]

pages_dir = os.path.join(src, 'pages')
components_dir = os.path.join(src, 'components')

changed = []
for d in [pages_dir, components_dir]:
    for fname in os.listdir(d):
        if not fname.endswith('.jsx') and not fname.endswith('.js'):
            continue
        fpath = os.path.join(d, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        original = content
        for old, new in replacements:
            content = content.replace(old, new)
        if content != original:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            changed.append(fname)

print('Changed:', changed)
