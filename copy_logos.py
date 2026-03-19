import shutil, os
base = r'C:\Users\franc\OneDrive\Escritorio\micocina\public'
# Icono solo (sin texto, sin fondo)
shutil.copy(os.path.join(base, 'ChatGPT_Image_19_mar_2026__04_12_39_p.m.-removebg-preview.png'), os.path.join(base, 'logo-icon.png'))
# Logo completo con texto MiCuchina (sin fondo)
shutil.copy(os.path.join(base, 'WhatsApp_Image_2026-03-19_at_15.31.33-removebg-preview (1).png'), os.path.join(base, 'logo-full.png'))
print('OK')
