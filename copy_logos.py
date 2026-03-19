import shutil, os
base = r'C:\Users\franc\OneDrive\Escritorio\micocina\public'
# logo-icon: icono solo sin texto (fondo transparente) - para header pequeño
shutil.copy(os.path.join(base, 'WhatsApp Image 2026-03-18 at 10.58.46.jpeg'), os.path.join(base, 'logo-icon.png'))
# logo-full: con texto MiCuchina fondo negro - para splash y login hero
shutil.copy(os.path.join(base, 'WhatsApp Image 2026-03-19 at 15.31.33.jpeg'), os.path.join(base, 'logo-full.png'))
print('OK')
