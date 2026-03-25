f = open(r'src\pages\StatsPage.jsx', encoding='utf-8').read()
# buscar lineas con bg-white o surface-100
for i,line in enumerate(f.split('\n'),1):
    if 'bg-white' in line or 'surface-100' in line or 'surface-50' in line:
        print(i, line.strip())
