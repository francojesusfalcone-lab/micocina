f = open(r'src/pages/IngredientFormPage.jsx','r',encoding='utf-8').read()
style = ' style={{backgroundColor:"var(--bg-input)",color:"var(--text-primary)",colorScheme:"dark"}}'
f2 = f.replace('<select\n', '<select' + style + '\n').replace('<select ', '<select' + style + ' ').replace('<select\r', '<select' + style + '\r')
# simpler: just replace all <select that don't already have style
count = f2.count('colorScheme')
if f != f2:
    open(r'src/pages/IngredientFormPage.jsx','w',encoding='utf-8').write(f2)
    print('changed', count)
else:
    print('no change')
