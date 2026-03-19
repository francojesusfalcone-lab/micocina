files = ['src/db.js', 'package.json', 'src/App.jsx', 'index.html', 'public/manifest.json']
for f in files:
    try:
        content = open(f, encoding='utf-8').read()
        new = content.replace('MiCocinaDB','MiCuchinaDB').replace('MiCocina','MiCuchina').replace('micochina','micuchina')
        if new != content:
            open(f, 'w', encoding='utf-8').write(new)
            print('changed:', f)
        else:
            print('ok:', f)
    except Exception as e:
        print('error:', f, e)
