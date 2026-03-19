import base64

with open('/tmp/icon_b64.txt') as f:
    data = f.read()
with open(r'C:\Users\franc\OneDrive\Escritorio\micocina\public\logo-icon.png', 'wb') as f:
    f.write(base64.b64decode(data))

with open('/tmp/full_b64.txt') as f:
    data = f.read()
with open(r'C:\Users\franc\OneDrive\Escritorio\micocina\public\logo-full.png', 'wb') as f:
    f.write(base64.b64decode(data))

print('ok')
