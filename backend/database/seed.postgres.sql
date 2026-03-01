BEGIN;

TRUNCATE TABLE
  user_logs,
  transfer_items,
  transfers,
  sale_items,
  sales,
  quote_items,
  quotes,
  cart_items,
  cart,
  inventory,
  product_images,
  products,
  subscribers,
  customers,
  users,
  categories,
  stores,
  roles
RESTART IDENTITY CASCADE;

INSERT INTO roles (id, name) VALUES
  (1, 'ADMIN'),
  (2, 'GERENTE');

INSERT INTO stores (id, code, name, city, created_at) VALUES
  (1, 'CHIM', 'Pradera Chimaltenango', 'Chimaltenango', '2026-01-01 08:00:00'),
  (2, 'ESC',  'Pradera Escuintla',     'Escuintla',     '2026-01-01 08:00:00'),
  (3, 'MAZ',  'Las Americas',          'Mazatenango',   '2026-01-01 08:00:00'),
  (4, 'COA',  'La Trinidad',           'Coatepeque',    '2026-01-01 08:00:00'),
  (5, 'XEL',  'Pradera Xela',          'Quetzaltenango','2026-01-01 08:00:00'),
  (6, 'MIR',  'Miraflores',            'Ciudad de Guatemala', '2026-01-01 08:00:00');

INSERT INTO categories (id, name, created_at) VALUES
  (1, 'Laptops',     '2026-01-01 08:00:00'),
  (2, 'Camaras',     '2026-01-01 08:00:00'),
  (3, 'Celulares',   '2026-01-01 08:00:00'),
  (4, 'Smartwatch',  '2026-01-01 08:00:00'),
  (5, 'Accesorios',  '2026-01-01 08:00:00');

-- Password para todos los usuarios: 123456
INSERT INTO users (id, name, email, password_hash, role_id, store_id, is_active, created_at) VALUES
  (1, 'Admin Principal', 'admin@store.com', '$2b$10$T7q3AWbJ/BJKGk8FzprhOOi1EWmm2vqsaT6jrR7MlTp0JizKRIMJm', 1, NULL, 1, '2026-01-01 09:00:00'),
  (2, 'Gerente Chimal',  'gerente.chim@store.com', '$2b$10$T7q3AWbJ/BJKGk8FzprhOOi1EWmm2vqsaT6jrR7MlTp0JizKRIMJm', 2, 1, 1, '2026-01-01 09:10:00'),
  (3, 'Gerente Escuintla','gerente.esc@store.com', '$2b$10$T7q3AWbJ/BJKGk8FzprhOOi1EWmm2vqsaT6jrR7MlTp0JizKRIMJm', 2, 2, 1, '2026-01-01 09:15:00');

INSERT INTO products (id, sku, name, description, category_id, price, is_active, created_at) VALUES
  (1, 'LAP-001',   'Laptop Pro 14',     'Laptop de alto rendimiento',         1, 8999.00, 1, '2026-01-02 10:00:00'),
  (2, 'LAP-002',   'Laptop Air 13',     'Laptop liviana para trabajo diario', 1, 7499.00, 1, '2026-01-02 10:05:00'),
  (3, 'CAM-001',   'Camara Zoom X',     'Camara digital 4K',                  2, 2499.00, 1, '2026-01-02 10:10:00'),
  (4, 'PHONE-001', 'Phone Max 256',     'Telefono inteligente 256GB',         3, 3299.00, 1, '2026-01-02 10:15:00'),
  (5, 'WATCH-001', 'Watch Fit 2',       'Reloj inteligente deportivo',        4, 1799.00, 1, '2026-01-02 10:20:00'),
  (6, 'MOU-001',   'Mouse Inalambrico', 'Mouse ergonomico',                   5,   85.00, 1, '2026-01-02 10:25:00'),
  (7, 'HEAD-001',  'Auriculares Pro',   'Cancelacion de ruido',               5,  399.00, 1, '2026-01-02 10:30:00'),
  (8, 'CASE-001',  'Funda Premium',     'Funda resistente para smartphone',   5,   59.00, 1, '2026-01-02 10:35:00');

INSERT INTO product_images (id, product_id, url, is_primary, created_at) VALUES
  (1, 1, '/uploads/laptop-pro-14.jpg', 1, '2026-01-03 08:00:00'),
  (2, 4, '/uploads/phone-max-256.jpg', 1, '2026-01-03 08:05:00'),
  (3, 5, '/uploads/watch-fit-2.jpg',   1, '2026-01-03 08:10:00');

INSERT INTO inventory (store_id, product_id, stock) VALUES
  (1,1,15),(1,2,8),(1,3,6),(1,4,10),(1,5,7),(1,6,40),(1,7,20),(1,8,30),
  (2,1,10),(2,2,9),(2,3,4),(2,4,12),(2,5,5),(2,6,35),(2,7,18),(2,8,25),
  (3,1,6),(3,2,7),(3,3,3),(3,4,9),(3,5,4),(3,6,22),(3,7,15),(3,8,17),
  (4,1,5),(4,2,5),(4,3,2),(4,4,7),(4,5,3),(4,6,18),(4,7,11),(4,8,14),
  (5,1,4),(5,2,4),(5,3,2),(5,4,6),(5,5,3),(5,6,15),(5,7,10),(5,8,12),
  (6,1,3),(6,2,3),(6,3,1),(6,4,5),(6,5,2),(6,6,12),(6,7,8),(6,8,10);

INSERT INTO customers (id, name, email, phone, is_subscribed, created_at) VALUES
  (1, 'Carlos Lopez', 'carlos@mail.com', '5555-1001', 1, '2026-01-05 11:00:00'),
  (2, 'Ana Perez',    'ana@mail.com',    '5555-1002', 1, '2026-01-06 11:00:00'),
  (3, 'Luis Mendez',  'luis@mail.com',   '5555-1003', 0, '2026-01-07 11:00:00'),
  (4, 'Maria Diaz',   'maria@mail.com',  '5555-1004', 1, '2026-01-08 11:00:00');

INSERT INTO subscribers (id, email, created_at) VALUES
  (1, 'carlos@mail.com', '2026-01-05 11:01:00'),
  (2, 'ana@mail.com',    '2026-01-06 11:01:00'),
  (3, 'promo@mail.com',  '2026-01-10 09:00:00');

INSERT INTO sales (id, customer_id, store_id, total, status, created_at) VALUES
  (1, 1, 1, 9169.00, 'PAGADA',  '2026-01-10 10:10:00'),
  (2, 2, 2, 6716.00, 'PAGADA',  '2026-01-15 12:20:00'),
  (3, 1, 1, 2898.00, 'PAGADA',  '2026-02-02 15:00:00'),
  (4, 3, 3, 1884.00, 'NUEVA',   '2026-02-10 09:30:00'),
  (5, 4, 2, 7499.00, 'ANULADA', '2026-02-20 16:45:00');

INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price) VALUES
  (1, 1, 1, 1, 8999.00),
  (2, 1, 6, 2,   85.00),
  (3, 2, 4, 2, 3299.00),
  (4, 2, 8, 2,   59.00),
  (5, 3, 3, 1, 2499.00),
  (6, 3, 7, 1,  399.00),
  (7, 4, 5, 1, 1799.00),
  (8, 4, 6, 1,   85.00),
  (9, 5, 2, 1, 7499.00);

INSERT INTO quotes (id, customer_id, store_id, valid_until, created_at) VALUES
  (1, 3, 1, '2026-03-10', '2026-03-03 09:00:00'),
  (2, 2, 2, '2026-03-12', '2026-03-05 14:30:00');

INSERT INTO quote_items (id, quote_id, product_id, quantity, unit_price) VALUES
  (1, 1, 2, 1, 7499.00),
  (2, 1, 6, 2,   85.00),
  (3, 2, 4, 1, 3299.00),
  (4, 2, 8, 1,   59.00);

INSERT INTO transfers (id, from_store_id, to_store_id, status, created_by, approved_by, created_at, approved_at) VALUES
  (1, 1, 2, 'COMPLETADO', 2, 1, '2026-02-05 10:00:00', '2026-02-05 11:00:00'),
  (2, 2, 3, 'PENDIENTE',  3, NULL, '2026-02-25 13:00:00', NULL);

INSERT INTO transfer_items (id, transfer_id, product_id, quantity) VALUES
  (1, 1, 1, 2),
  (2, 1, 6, 10),
  (3, 2, 4, 1),
  (4, 2, 8, 5);

INSERT INTO user_logs (id, user_id, action, entity, entity_id, store_id, before_json, after_json, created_at) VALUES
  (1, 1, 'CREATE', 'product', '8', NULL, NULL, '{"sku":"CASE-001","name":"Funda Premium"}', '2026-01-02 10:36:00'),
  (2, 2, 'APPROVE', 'transfer', '1', 2, NULL, '{"status":"COMPLETADO"}', '2026-02-05 11:01:00'),
  (3, 1, 'UPDATE_STATUS', 'sale', '4', 3, '{"status":"NUEVA"}', '{"status":"PAGADA"}', '2026-02-11 10:00:00');

-- Ajustar secuencias despues de inserts con id explicito
SELECT setval('roles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM roles), true);
SELECT setval('stores_id_seq', (SELECT COALESCE(MAX(id), 1) FROM stores), true);
SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories), true);
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users), true);
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products), true);
SELECT setval('product_images_id_seq', (SELECT COALESCE(MAX(id), 1) FROM product_images), true);
SELECT setval('customers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM customers), true);
SELECT setval('subscribers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM subscribers), true);
SELECT setval('sales_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sales), true);
SELECT setval('sale_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sale_items), true);
SELECT setval('quotes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM quotes), true);
SELECT setval('quote_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM quote_items), true);
SELECT setval('transfers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM transfers), true);
SELECT setval('transfer_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM transfer_items), true);
SELECT setval('user_logs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM user_logs), true);
SELECT setval('cart_id_seq', (SELECT COALESCE(MAX(id), 1) FROM cart), true);
SELECT setval('cart_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM cart_items), true);

COMMIT;
