f = open(r'src\pages\OrderFormPage.jsx', encoding='utf-8').read()
f2 = f.replace(
    'max-w-md mx-auto bg-white border-t border-app px-4 py-3 z-30">',
    'max-w-md mx-auto border-t border-app px-4 py-3 z-30" style={{backgroundColor:"var(--bg-app)"}}>'
)
# También arreglar botones mode que tienen bg-white
f2 = f2.replace("'border-app bg-white'", "'border-app'").replace(
    ': \'border-app bg-white text-gray-500\'', ': \'border-app text-app-muted\''
)
open(r'src\pages\OrderFormPage.jsx', 'w', encoding='utf-8').write(f2)
print('done')
