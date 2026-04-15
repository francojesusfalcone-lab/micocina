-- Todas las tablas de datos de MiCuchina
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ingredients (
  id           BIGINT PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  category     TEXT,
  unit         TEXT,
  price_per_unit NUMERIC,
  stock        NUMERIC DEFAULT 0,
  min_stock    NUMERIC DEFAULT 0,
  created_at   TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ,
  deleted_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ingredient_price_history (
  id            BIGINT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_id BIGINT,
  price         NUMERIC,
  date          TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS recipes (
  id               BIGINT PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  category         TEXT,
  sale_price       NUMERIC,
  is_active        BOOLEAN DEFAULT true,
  is_premium_combo BOOLEAN DEFAULT false,
  combo_items      JSONB,
  notes            TEXT,
  created_at       TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ,
  deleted_at       TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id         BIGINT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id  BIGINT,
  ingredient_id BIGINT,
  quantity   NUMERIC,
  unit       TEXT,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS orders (
  id             BIGINT PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name    TEXT,
  client_id      BIGINT,
  client_phone   TEXT,
  client_address TEXT,
  status         TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'cash',
  delivery_time  TEXT,
  notes          TEXT,
  total          NUMERIC DEFAULT 0,
  is_paid        BOOLEAN DEFAULT false,
  stock_deducted BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ,
  deleted_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS order_items (
  id         BIGINT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id   BIGINT,
  recipe_id  BIGINT,
  quantity   NUMERIC,
  unit_price NUMERIC,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS clients (
  id         BIGINT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  phone      TEXT,
  address    TEXT,
  notes      TEXT,
  balance    NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS expenses (
  id           BIGINT PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  category     TEXT,
  amount       NUMERIC,
  is_recurring BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ,
  deleted_at   TIMESTAMPTZ
);

-- RLS en todas las tablas
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Políticas: cada usuario solo ve sus datos
CREATE POLICY "own_ingredients" ON ingredients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_price_history" ON ingredient_price_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_recipes" ON recipes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_recipe_ingredients" ON recipe_ingredients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_orders" ON orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_order_items" ON order_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_clients" ON clients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_expenses" ON expenses FOR ALL USING (auth.uid() = user_id);
