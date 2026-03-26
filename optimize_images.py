from PIL import Image
import os

public = r'C:\Users\franc\OneDrive\Escritorio\micocina\public'
files = ['empty-productos.png', 'empty-comandas.png', 'empty-stock.png']

for fname in files:
    path = os.path.join(public, fname)
    if not os.path.exists(path):
        print(f'NOT FOUND: {fname}')
        continue
    img = Image.open(path).convert('RGBA')
    before = os.path.getsize(path) / 1024
    if img.width > 600:
        ratio = 600 / img.width
        img = img.resize((600, int(img.height * ratio)), Image.LANCZOS)
    out = path.replace('.png', '.webp')
    img.save(out, 'WEBP', quality=82, method=6)
    after = os.path.getsize(out) / 1024
    print(f'{fname}: {before:.0f}KB -> {after:.0f}KB')
