import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """API для админ-панели: управление товарами и заказами"""
    
    method = event.get('httpMethod', 'GET')
    path_params = event.get('pathParams') or {}
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        db_url = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query_params = event.get('queryStringParameters') or {}
        action = query_params.get('action', '')
        
        if method == 'GET':
            if action == 'products':
                cur.execute(
                    """
                    SELECT p.*, c.name as category_name, c.slug as category_slug
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.id
                    ORDER BY p.created_at DESC
                    """
                )
                products = cur.fetchall()
                
                result = []
                for p in products:
                    product = dict(p)
                    product['price'] = float(product['price'])
                    product['created_at'] = product['created_at'].isoformat() if product['created_at'] else None
                    product['updated_at'] = product['updated_at'].isoformat() if product['updated_at'] else None
                    result.append(product)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'products': result}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            elif action == 'orders':
                status_filter = query_params.get('status', '')
                
                if status_filter:
                    cur.execute(
                        """
                        SELECT o.*, 
                               json_agg(
                                   json_build_object(
                                       'id', oi.id,
                                       'product_name', oi.product_name,
                                       'product_price', oi.product_price,
                                       'quantity', oi.quantity,
                                       'subtotal', oi.subtotal
                                   )
                               ) as items
                        FROM orders o
                        LEFT JOIN order_items oi ON o.id = oi.order_id
                        WHERE o.status = %s
                        GROUP BY o.id
                        ORDER BY o.created_at DESC
                        """,
                        (status_filter,)
                    )
                else:
                    cur.execute(
                        """
                        SELECT o.*, 
                               json_agg(
                                   json_build_object(
                                       'id', oi.id,
                                       'product_name', oi.product_name,
                                       'product_price', oi.product_price,
                                       'quantity', oi.quantity,
                                       'subtotal', oi.subtotal
                                   )
                               ) as items
                        FROM orders o
                        LEFT JOIN order_items oi ON o.id = oi.order_id
                        GROUP BY o.id
                        ORDER BY o.created_at DESC
                        """
                    )
                
                orders = cur.fetchall()
                
                result = []
                for order in orders:
                    order_dict = dict(order)
                    order_dict['created_at'] = order_dict['created_at'].isoformat() if order_dict['created_at'] else None
                    order_dict['updated_at'] = order_dict['updated_at'].isoformat() if order_dict['updated_at'] else None
                    order_dict['total_amount'] = float(order_dict['total_amount'])
                    
                    if order_dict['items']:
                        for item in order_dict['items']:
                            if item:
                                item['product_price'] = float(item['product_price'])
                                item['subtotal'] = float(item['subtotal'])
                    
                    result.append(order_dict)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'orders': result}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            elif action == 'categories':
                cur.execute("SELECT * FROM categories ORDER BY name")
                categories = cur.fetchall()
                
                result = []
                for cat in categories:
                    cat_dict = dict(cat)
                    cat_dict['created_at'] = cat_dict['created_at'].isoformat() if cat_dict.get('created_at') else None
                    result.append(cat_dict)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'categories': result}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            if action == 'product':
                cur.execute(
                    """
                    INSERT INTO products (name, description, price, category_id, image_url, is_available)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (body.get('name'), body.get('description'), body.get('price'),
                     body.get('category_id'), body.get('image_url'), body.get('is_available', True))
                )
                result = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'id': result['id'], 'message': 'Товар создан'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
        
        elif method in ['PUT', 'PATCH']:
            body = json.loads(event.get('body', '{}'))
            
            if action == 'product':
                product_id = body.get('id')
                
                cur.execute(
                    """
                    UPDATE products 
                    SET name = %s, description = %s, price = %s, 
                        category_id = %s, image_url = %s, is_available = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    """,
                    (body.get('name'), body.get('description'), body.get('price'),
                     body.get('category_id'), body.get('image_url'), body.get('is_available'),
                     product_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Товар обновлён'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            elif action == 'order_status':
                order_id = body.get('order_id')
                new_status = body.get('status')
                
                cur.execute(
                    """
                    UPDATE orders 
                    SET status = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    """,
                    (new_status, order_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Статус заказа обновлён'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Неверные параметры запроса'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
