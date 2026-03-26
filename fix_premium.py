f = open(r'src\pages\PremiumPage.jsx', encoding='utf-8').read()
f2 = f.replace('bg-primary-50 border-2 border-primary-200', 'border-2 border-app" style={{backgroundColor:"var(--bg-card)"}}')
open(r'src\pages\PremiumPage.jsx', 'w', encoding='utf-8').write(f2)
print('done, remaining:', f2.count('bg-primary-50 border-2'))
