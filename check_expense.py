f = open(r'src\pages\ExpenseFormPage.jsx', encoding='utf-8').read()
for i,line in enumerate(f.split('\n'),1):
    if 'bg-white' in line or 'surface' in line:
        print(i, line.strip())
