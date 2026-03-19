import os, re

src = r'C:\Users\franc\OneDrive\Escritorio\micocina\src'

# Reemplazos de clases de texto (orden importa: más específico primero)
replacements = [
    # Texto principal
    ('text-gray-900 truncate',        'text-app-primary truncate'),
    ('text-gray-900"',                'text-app-primary"'),
    ('text-gray-900 ',                'text-app-primary '),
    # Texto secundario
    ('text-gray-800"',                'text-app-secondary"'),
    ('text-gray-800 ',                'text-app-secondary '),
    ('text-gray-700"',                'text-app-secondary"'),
    ('text-gray-700 ',                'text-app-secondary '),
    # Texto muted
    ('text-gray-600"',                'text-app-muted"'),
    ('text-gray-600 ',                'text-app-muted '),
    ('text-gray-500 mt-',             'text-app-muted mt-'),
    ('text-gray-500"',                'text-app-muted"'),
    ('text-gray-500 ',                'text-app-muted '),
    # Texto faint
    ('text-gray-400"',                'text-app-faint"'),
    ('text-gray-400 ',                'text-app-faint '),
    ('text-gray-400 mt-',             'text-app-faint mt-'),
    # Fondos
    ('bg-white border-b border-surface-200', 'bg-surface border-b border-app'),
    ('bg-white rounded-2xl',          'bg-card-color rounded-2xl'),
    ('bg-white/90',                   'bg-surface/90'),
    ('bg-surface-50"',                'bg-app"'),
    ('bg-surface-50 ',                'bg-app '),
    # Bordes
    ('border-surface-200"',           'border-app"'),
    ('border-surface-200 ',           'border-app '),
    ('border-gray-800"',              'border-app"'),
    ('dark:border-gray-800',          ''),
    ('dark:bg-gray-900 ',             ''),
    ('dark:bg-gray-950',              ''),
    ('dark:text-gray-100',            ''),
    ('dark:text-gray-400',            ''),
    ('dark:text-gray-500',            ''),
    ('dark:bg-gray-800',              ''),
    ('dark:border-gray-800',          ''),
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

print('Changed files:', len(changed))
for f in changed:
    print(' -', f)
