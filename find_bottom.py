import os
files = [
    r'src\pages\RecipeFormPage.jsx',
    r'src\pages\OrderFormPage.jsx',
    r'src\pages\IngredientFormPage.jsx',
]
for f in files:
    content = open(f, encoding='utf-8').read()
    if 'fixed bottom' in content:
        for line in content.split('\n'):
            if 'fixed bottom' in line or 'bg-white' in line:
                print(f'{f}: {line.strip()}')
