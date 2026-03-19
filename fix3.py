import os

src = r'C:\Users\franc\OneDrive\Escritorio\micocina\src'

# Reemplazos para hacer todo uniforme
replacements = [
    # Barras de búsqueda blancas
    ('px-4 py-3 bg-surface border-b border-app', 'px-4 py-3 border-b border-app" style={{backgroundColor:"var(--bg-app)"}}'),
    # Cards con fondo blanco explícito dentro de listas
    ('className="bg-white rounded-2xl',    'className="bg-card-color rounded-2xl'),
    ('className="bg-card-color rounded-2xl shadow-card border border-surface-200', 'className="bg-card-color rounded-2xl shadow-card border-app'),
    # active states blancos
    ('active:bg-surface-100 transition-colors text-left"', 'active:opacity-70 transition-opacity text-left"'),
    ('active:bg-surface-100 dark:active:bg-gray-800 transition-colors"', 'active:opacity-70 transition-opacity"'),
    # Tabs inactivos
    ('bg-surface-100  text-app-muted ',    'text-app-muted" style={{backgroundColor:"var(--bg-input)"}}"'),
]

pages_dir = os.path.join(src, 'pages')
components_dir = os.path.join(src, 'components')

changed = []
for d in [pages_dir, components_dir]:
    for fname in os.listdir(d):
        if not (fname.endswith('.jsx') or fname.endswith('.js')):
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
