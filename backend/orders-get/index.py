import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """API для получения информации о заказах клиентов"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        try:
            query_params = event.get('queryStringParameters') or {}
            phone = query_params.get('phone', '')
            email = query_params.get('email', '')
            order_id = query_params.get('order_id', '')
            
            if not phone and not email and not order_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Укажите телефон, email или номер заказа'}),
                    'isBase64Encoded': False
                }
            
            db_url = os.environ.get('DATABASE_URL')
            conn = psycopg2.connect(db_url)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            if order_id:
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
                    WHERE o.id = %s
                    GROUP BY o.id
                    ORDER BY o.created_at DESC
                    """,
                    (order_id,)
                )
            elif phone:
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
                    WHERE o.customer_phone = %s
                    GROUP BY o.id
                    ORDER BY o.created_at DESC
                    """,
                    (phone,)
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
                    WHERE o.customer_email = %s
                    GROUP BY o.id
                    ORDER BY o.created_at DESC
                    """,
                    (email,)
                )
            
            orders = cur.fetchall()
            cur.close()
            conn.close()
            
            orders_list = []
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
                
                orders_list.append(order_dict)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'orders': orders_list,
                    'total': len(orders_list)
                }, ensure_ascii=False),
                'isBase64Encoded': False
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Метод не поддерживается'}),
        'isBase64Encoded': False
    }
