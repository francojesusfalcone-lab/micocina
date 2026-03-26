f = open(r'src\pages\PremiumPage.jsx', encoding='utf-8').read()
# Fix the broken JSX from previous replacement
f2 = f.replace(
    'border-2 border-app" style={{backgroundColor:"var(--bg-card)"}} flex items-center justify-center">',
    'border-2 border-app flex items-center justify-center" style={{backgroundColor:"var(--bg-card)"}}>'
)
open(r'src\pages\PremiumPage.jsx', 'w', encoding='utf-8').write(f2)
print('fixed:', f2.count('border-2 border-app flex'))
