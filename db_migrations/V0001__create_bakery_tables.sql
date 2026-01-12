-- Создание таблиц для кондитерской-пекарни

-- Категории товаров
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Товары
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Заказы
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(200) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(200),
    delivery_method VARCHAR(50) NOT NULL CHECK (delivery_method IN ('delivery', 'pickup')),
    delivery_address TEXT,
    comments TEXT,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Позиции заказа
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(200) NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Заполнение начальными данными
INSERT INTO categories (name, slug) VALUES
    ('Круассаны', 'croissants'),
    ('Торты', 'cakes'),
    ('Десерты', 'pastries'),
    ('Хлеб', 'bread')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, description, price, category_id, image_url) VALUES
    ('Круассан классический', 'Хрустящий французский круассан из слоёного теста', 180.00, (SELECT id FROM categories WHERE slug = 'croissants'), 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop'),
    ('Шоколадный торт', 'Нежный бисквитный торт с бельгийским шоколадом', 2500.00, (SELECT id FROM categories WHERE slug = 'cakes'), 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'),
    ('Эклеры ассорти', 'Французские пирожные с кремом разных вкусов', 350.00, (SELECT id FROM categories WHERE slug = 'pastries'), 'https://images.unsplash.com/photo-1612201142855-c337de87f556?w=400&h=300&fit=crop'),
    ('Ягодный тарт', 'Песочная корзиночка со свежими ягодами и кремом', 450.00, (SELECT id FROM categories WHERE slug = 'pastries'), 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=300&fit=crop'),
    ('Медовик классический', 'Традиционный медовый торт с кремом', 2200.00, (SELECT id FROM categories WHERE slug = 'cakes'), 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400&h=300&fit=crop'),
    ('Багет французский', 'Хрустящий багет на закваске', 120.00, (SELECT id FROM categories WHERE slug = 'bread'), 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop'),
    ('Круассан с шоколадом', 'Слоёный круассан с бельгийским шоколадом внутри', 220.00, (SELECT id FROM categories WHERE slug = 'croissants'), 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=400&h=300&fit=crop'),
    ('Наполеон', 'Классический торт из слоёного теста с заварным кремом', 2800.00, (SELECT id FROM categories WHERE slug = 'cakes'), 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop');