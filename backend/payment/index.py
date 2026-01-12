import json
import os
import base64
import requests
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """API для создания платежей через ЮKassa"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            action = body.get('action', '')
            
            if action == 'create_payment':
                order_id = body.get('order_id')
                amount = body.get('amount')
                description = body.get('description', f'Оплата заказа #{order_id}')
                return_url = body.get('return_url', 'https://your-site.com')
                
                if not order_id or not amount:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Не указаны обязательные параметры'}),
                        'isBase64Encoded': False
                    }
                
                shop_id = os.environ.get('YUKASSA_SHOP_ID', '')
                secret_key = os.environ.get('YUKASSA_SECRET_KEY', '')
                
                if not shop_id or not secret_key:
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'ЮKassa не настроена. Добавьте ключи в секреты проекта'}),
                        'isBase64Encoded': False
                    }
                
                auth_string = f'{shop_id}:{secret_key}'
                auth_base64 = base64.b64encode(auth_string.encode()).decode()
                
                payment_data = {
                    'amount': {
                        'value': str(amount),
                        'currency': 'RUB'
                    },
                    'confirmation': {
                        'type': 'redirect',
                        'return_url': return_url
                    },
                    'capture': True,
                    'description': description,
                    'metadata': {
                        'order_id': order_id
                    }
                }
                
                headers = {
                    'Authorization': f'Basic {auth_base64}',
                    'Content-Type': 'application/json',
                    'Idempotence-Key': f'order-{order_id}-{context.request_id}'
                }
                
                response = requests.post(
                    'https://api.yookassa.ru/v3/payments',
                    json=payment_data,
                    headers=headers,
                    timeout=10
                )
                
                if response.status_code in [200, 201]:
                    payment_response = response.json()
                    payment_id = payment_response.get('id')
                    payment_url = payment_response.get('confirmation', {}).get('confirmation_url')
                    
                    db_url = os.environ.get('DATABASE_URL')
                    conn = psycopg2.connect(db_url)
                    cur = conn.cursor()
                    
                    cur.execute(
                        """
                        UPDATE orders 
                        SET payment_method = 'online', 
                            payment_status = 'pending',
                            payment_id = %s,
                            payment_url = %s,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                        """,
                        (payment_id, payment_url, order_id)
                    )
                    
                    conn.commit()
                    cur.close()
                    conn.close()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'payment_id': payment_id,
                            'payment_url': payment_url,
                            'status': payment_response.get('status')
                        }),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': response.status_code,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Ошибка создания платежа в ЮKassa', 'details': response.text}),
                        'isBase64Encoded': False
                    }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
                'isBase64Encoded': False
            }
    
    elif method == 'GET':
        try:
            query_params = event.get('queryStringParameters') or {}
            payment_id = query_params.get('payment_id', '')
            
            if not payment_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Не указан payment_id'}),
                    'isBase64Encoded': False
                }
            
            shop_id = os.environ.get('YUKASSA_SHOP_ID', '')
            secret_key = os.environ.get('YUKASSA_SECRET_KEY', '')
            
            auth_string = f'{shop_id}:{secret_key}'
            auth_base64 = base64.b64encode(auth_string.encode()).decode()
            
            headers = {
                'Authorization': f'Basic {auth_base64}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f'https://api.yookassa.ru/v3/payments/{payment_id}',
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                payment_info = response.json()
                payment_status = payment_info.get('status')
                
                if payment_status == 'succeeded':
                    order_id = payment_info.get('metadata', {}).get('order_id')
                    
                    if order_id:
                        db_url = os.environ.get('DATABASE_URL')
                        conn = psycopg2.connect(db_url)
                        cur = conn.cursor()
                        
                        cur.execute(
                            """
                            UPDATE orders 
                            SET payment_status = 'paid',
                                status = 'confirmed',
                                updated_at = CURRENT_TIMESTAMP
                            WHERE id = %s
                            """,
                            (order_id,)
                        )
                        
                        conn.commit()
                        cur.close()
                        conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'payment_id': payment_id,
                        'status': payment_status,
                        'paid': payment_info.get('paid'),
                        'amount': payment_info.get('amount')
                    }),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': response.status_code,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Ошибка получения статуса платежа'}),
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
