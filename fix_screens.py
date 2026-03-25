import os

files = {
    r'src\pages\StatsPage.jsx': [
        # Tabs Hoy/Semana/Mes/Año con bg-white
        ("bg-white text-gray-500", "text-app-muted"),
        ("bg-white text-app-muted", "text-app-muted"),
    ],
    r'src\pages\QuickPricePage.jsx': [
        ("border-app bg-white text-gray-600", "border-app text-app-secondary"),
        ("border-app bg-white text-gray-500", "border-app text-app-muted"),
        (": 'border-app bg-white'", ": 'border-app'"),
    ],
    r'src\pages\ExpensesPage.jsx': [
        ("bg-white rounded-xl", "rounded-xl"),
        ("bg-surface-100", ""),
    ],
    r'src\pages\ClientsPage.jsx': [
        ("bg-white rounded-xl", "rounded-xl"),
        ("bg-surface-100", ""),
    ],
}

for fpath, replacements in files.items():
    if not os.path.exists(fpath):
        print(f'NOT FOUND: {fpath}')
        continue
    content = open(fpath, encoding='utf-8').read()
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
    if content != original:
        open(fpath, 'w', encoding='utf-8').write(content)
        print(f'changed: {fpath}')
    else:
        print(f'no match: {fpath}')
