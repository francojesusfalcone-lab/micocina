f = open(r'src\pages\ExpenseFormPage.jsx', encoding='utf-8').read()
f2 = f.replace(
    ": 'border-app bg-white'",
    ": 'border-app'"
).replace(
    'max-w-md mx-auto bg-white border-t border-app px-4 py-3 z-30">',
    'max-w-md mx-auto border-t border-app px-4 py-3 z-30" style={{backgroundColor:"var(--bg-app)"}}>'
)
open(r'src\pages\ExpenseFormPage.jsx', 'w', encoding='utf-8').write(f2)
print('done, bg-white remaining:', f2.count('bg-white'))
