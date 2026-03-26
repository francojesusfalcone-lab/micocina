import os
files = [
    r'src\components\EmptyState.jsx',
    r'src\pages\ProductsPage.jsx',
    r'src\pages\OrdersPage.jsx',
    r'src\pages\StockPage.jsx',
]
for f in files:
    c = open(f, encoding='utf-8').read()
    c2 = c.replace('empty-productos.png','empty-productos.webp').replace('empty-comandas.png','empty-comandas.webp').replace('empty-stock.png','empty-stock.webp')
    if c != c2:
        open(f, 'w', encoding='utf-8').write(c2)
        print('changed:', f)
