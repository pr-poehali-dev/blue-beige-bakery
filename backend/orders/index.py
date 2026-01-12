import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """API для приёма и обработки заказов из кондитерской"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            
            customer_name = body.get('customer_name', '')
            customer_phone = body.get('customer_phone', '')
            customer_email = body.get('customer_email', '')
            delivery_method = body.get('delivery_method', 'pickup')
            delivery_address = body.get('delivery_address', '')
            comments = body.get('comments', '')
            items = body.get('items', [])
            total_amount = body.get('total_amount', 0)
            
            if not customer_name or not customer_phone or not items:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Не заполнены обязательные поля'}),
                    'isBase64Encoded': False
                }
            
            db_url = os.environ.get('DATABASE_URL')
            conn = psycopg2.connect(db_url)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute(
                """
                INSERT INTO orders (customer_name, customer_phone, customer_email, 
                                    delivery_method, delivery_address, comments, total_amount, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (customer_name, customer_phone, customer_email, 
                 delivery_method, delivery_address, comments, total_amount, 'new')
            )
            
            order_result = cur.fetchone()
            order_id = order_result['id']
            
            for item in items:
                cur.execute(
                    """
                    INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (order_id, item.get('id'), item.get('name'), item.get('price'), 
                     item.get('quantity', 1), item.get('price', 0) * item.get('quantity', 1))
                )
            
            conn.commit()
            cur.close()
            conn.close()
            
            send_order_notification(order_id, customer_name, customer_email, customer_phone, 
                                    delivery_method, delivery_address, items, total_amount, comments)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'message': 'Заказ успешно создан',
                    'order_id': order_id
                }),
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


def send_order_notification(order_id: int, customer_name: str, customer_email: str, 
                            customer_phone: str, delivery_method: str, delivery_address: str,
                            items: list, total_amount: float, comments: str):
    """Отправка email уведомления о новом заказе"""
    
    smtp_host = os.environ.get('SMTP_HOST', '')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    bakery_email = os.environ.get('BAKERY_EMAIL', '')
    
    if not all([smtp_host, smtp_user, smtp_password, bakery_email]):
        print('SMTP настройки не указаны, email не отправлен')
        return
    
    items_html = ''
    for item in items:
        items_html += f"""
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">{item.get('name')}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">{item.get('quantity')}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">{item.get('price')} ₽</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">{item.get('price') * item.get('quantity')} ₽</td>
        </tr>
        """
    
    delivery_info = 'Самовывоз из пекарни' if delivery_method == 'pickup' else f'Доставка по адресу: {delivery_address}'
    
    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #D3E4FD 0%, #FDE1D3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: #333; margin: 0;">🥐 Новый заказ #{order_id}</h1>
            </div>
            
            <div style="padding: 30px; background: #fff; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #0EA5E9; margin-top: 0;">Данные клиента</h2>
                <p><strong>Имя:</strong> {customer_name}</p>
                <p><strong>Телефон:</strong> {customer_phone}</p>
                <p><strong>Email:</strong> {customer_email}</p>
                
                <h2 style="color: #0EA5E9; margin-top: 30px;">Способ получения</h2>
                <p>{delivery_info}</p>
                
                {f'<h2 style="color: #0EA5E9; margin-top: 30px;">Комментарий</h2><p>{comments}</p>' if comments else ''}
                
                <h2 style="color: #0EA5E9; margin-top: 30px;">Состав заказа</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #0EA5E9;">Товар</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #0EA5E9;">Кол-во</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #0EA5E9;">Цена</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #0EA5E9;">Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
                
                <div style="margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: right;">
                    <h3 style="margin: 0; color: #0EA5E9;">Итого: {total_amount} ₽</h3>
                </div>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px; text-align: center;">
                    Заказ создан {datetime.now().strftime('%d.%m.%Y в %H:%M')}
                </p>
            </div>
        </body>
    </html>
    """
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Новый заказ #{order_id} - Сладкий рай'
    msg['From'] = smtp_user
    msg['To'] = bakery_email
    
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))
    
    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        print(f'Email отправлен успешно на {bakery_email}')
    except Exception as e:
        print(f'Ошибка отправки email: {str(e)}')
