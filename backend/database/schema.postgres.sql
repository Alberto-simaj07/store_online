CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE CHECK (name IN ('ADMIN', 'GERENTE'))
);

CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  category_id INT REFERENCES categories(id),
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url VARCHAR(255) NOT NULL,
  is_primary SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) UNIQUE,
  phone VARCHAR(30),
  is_subscribed SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id),
  session_id VARCHAR(128) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  cart_id INT NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  UNIQUE (cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS inventory (
  store_id INT NOT NULL REFERENCES stores(id),
  product_id INT NOT NULL REFERENCES products(id),
  stock INT NOT NULL DEFAULT 0,
  PRIMARY KEY (store_id, product_id)
);

CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id),
  store_id INT REFERENCES stores(id),
  valid_until DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quote_items (
  id SERIAL PRIMARY KEY,
  quote_id INT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id),
  store_id INT REFERENCES stores(id),
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'NUEVA' CHECK (status IN ('NUEVA', 'PAGADA', 'ANULADA')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS transfers (
  id SERIAL PRIMARY KEY,
  from_store_id INT NOT NULL REFERENCES stores(id),
  to_store_id INT NOT NULL REFERENCES stores(id),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
    CHECK (status IN ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'ANULADO')),
  created_by INT,
  approved_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transfer_items (
  id SERIAL PRIMARY KEY,
  transfer_id INT NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL REFERENCES roles(id),
  store_id INT REFERENCES stores(id),
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  action VARCHAR(80) NOT NULL,
  entity VARCHAR(80) NOT NULL,
  entity_id VARCHAR(80),
  store_id INT REFERENCES stores(id),
  before_json JSONB,
  after_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (id, name) VALUES
  (1, 'ADMIN'),
  (2, 'GERENTE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO stores (id, code, name, city) VALUES
  (1, 'CHIM', 'Pradera Chimaltenango', 'Chimaltenango'),
  (2, 'ESC', 'Pradera Escuintla', 'Escuintla'),
  (3, 'MAZ', 'Las Americas', 'Mazatenango'),
  (4, 'COA', 'La Trinidad', 'Coatepeque'),
  (5, 'XEL', 'Pradera Xela', 'Quetzaltenango'),
  (6, 'MIR', 'Miraflores', 'Ciudad de Guatemala')
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name) VALUES
  (1, 'Laptops'),
  (2, 'Camaras'),
  (3, 'Celulares'),
  (4, 'Smartwatch'),
  (5, 'Accesorios')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, name, email, password_hash, role_id) VALUES
  (
    1,
    'Admin Principal',
    'admin@store.com',
    '$2b$10$T7q3AWbJ/BJKGk8FzprhOOi1EWmm2vqsaT6jrR7MlTp0JizKRIMJm',
    1
  )
ON CONFLICT (id) DO NOTHING;

SELECT setval('roles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM roles), true);
SELECT setval('stores_id_seq', (SELECT COALESCE(MAX(id), 1) FROM stores), true);
SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories), true);
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products), true);
SELECT setval('product_images_id_seq', (SELECT COALESCE(MAX(id), 1) FROM product_images), true);
SELECT setval('customers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM customers), true);
SELECT setval('cart_id_seq', (SELECT COALESCE(MAX(id), 1) FROM cart), true);
SELECT setval('cart_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM cart_items), true);
SELECT setval('quotes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM quotes), true);
SELECT setval('quote_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM quote_items), true);
SELECT setval('sales_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sales), true);
SELECT setval('sale_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sale_items), true);
SELECT setval('transfers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM transfers), true);
SELECT setval('transfer_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM transfer_items), true);
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users), true);
SELECT setval('user_logs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM user_logs), true);
SELECT setval('subscribers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM subscribers), true);
