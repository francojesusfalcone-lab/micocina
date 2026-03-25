f = open(r'src\pages\RecipeFormPage.jsx', encoding='utf-8').read()
f2 = f.replace(
    ": 'border-app bg-white text-gray-500'",
    ": 'border-app text-app-muted'"
).replace(
    ": 'border-app bg-white text-gray-600'",
    ": 'border-app text-app-secondary'"
)
open(r'src\pages\RecipeFormPage.jsx', 'w', encoding='utf-8').write(f2)
print('done', f2.count('bg-white'))
