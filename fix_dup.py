f=open(r'src/pages/IngredientFormPage.jsx','r',encoding='utf-8').read()
style='style={{backgroundColor:"var(--bg-input)",color:"var(--text-primary)",colorScheme:"dark"}}'
bad=style+' '+style
f2=f.replace(bad,style)
print('fixed' if f!=f2 else 'already ok', f2.count('colorScheme'))
open(r'src/pages/IngredientFormPage.jsx','w',encoding='utf-8').write(f2)
