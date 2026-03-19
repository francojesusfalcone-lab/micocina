import base64, os

# Logo icono (PNG transparente - circulo verde con flecha dorada)
icon_path = r'C:\Users\franc\OneDrive\Escritorio\micocina\public\logo-icon.png'
full_path = r'C:\Users\franc\OneDrive\Escritorio\micocina\public\logo-full.png'

os.makedirs(r'C:\Users\franc\OneDrive\Escritorio\micocina\public', exist_ok=True)

print("public dir ok")
print("icon exists:", os.path.exists(icon_path))
print("full exists:", os.path.exists(full_path))
