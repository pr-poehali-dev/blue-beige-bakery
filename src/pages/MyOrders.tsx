import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_method: string;
  delivery_address: string;
  comments: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

const MyOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'phone' | 'email'>('phone');
  const [searchValue, setSearchValue] = useState('');

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    new: { label: 'Новый', variant: 'default' },
    confirmed: { label: 'Подтверждён', variant: 'secondary' },
    preparing: { label: 'Готовится', variant: 'outline' },
    ready: { label: 'Готов', variant: 'default' },
    delivered: { label: 'Доставлен', variant: 'secondary' },
    cancelled: { label: 'Отменён', variant: 'destructive' }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchValue.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите телефон или email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append(searchType, searchValue.trim());
      
      const response = await fetch(`https://functions.poehali.dev/f0943979-e8e2-430e-a033-5aa76339e43b?${params}`);
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки заказов');
      }
      
      const data = await response.json();
      setOrders(data.orders || []);
      
      if (data.orders.length === 0) {
        toast({
          title: "Заказы не найдены",
          description: "По указанным данным заказы не найдены",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить заказы. Попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <Icon name="Cake" className="text-primary" size={28} />
            <span className="text-2xl font-bold">Сладкий рай</span>
          </a>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            <Icon name="Home" size={16} className="mr-2" />
            На главную
          </Button>
        </div>
      </header>

      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Мои заказы</h1>
            <p className="text-xl text-muted-foreground">Отслеживайте статус своих заказов</p>
          </div>

          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Search" size={24} />
                Поиск заказов
              </CardTitle>
              <CardDescription>Введите телефон или email, указанный при оформлении</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={searchType === 'phone' ? 'default' : 'outline'}
                    onClick={() => setSearchType('phone')}
                  >
                    <Icon name="Phone" size={16} className="mr-2" />
                    По телефону
                  </Button>
                  <Button
                    type="button"
                    variant={searchType === 'email' ? 'default' : 'outline'}
                    onClick={() => setSearchType('email')}
                  >
                    <Icon name="Mail" size={16} className="mr-2" />
                    По email
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search">
                    {searchType === 'phone' ? 'Номер телефона' : 'Email адрес'}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="search"
                      placeholder={searchType === 'phone' ? '+7 999 123-45-67' : 'ivan@example.com'}
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      required
                    />
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <Icon name="Loader2" size={18} className="animate-spin" />
                      ) : (
                        <>
                          <Icon name="Search" size={18} className="mr-2" />
                          Найти
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {orders.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Найдено заказов: {orders.length}</h2>
              
              {orders.map((order) => (
                <Card key={order.id} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl">Заказ #{order.id}</CardTitle>
                        <CardDescription className="mt-2">
                          {new Date(order.created_at).toLocaleString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
                      </div>
                      <Badge variant={statusLabels[order.status]?.variant || 'default'} className="text-lg px-4 py-1">
                        {statusLabels[order.status]?.label || order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <Icon name="User" size={20} className="text-primary mt-1" />
                        <div>
                          <p className="text-sm text-muted-foreground">Покупатель</p>
                          <p className="font-medium">{order.customer_name}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Icon name="Phone" size={20} className="text-primary mt-1" />
                        <div>
                          <p className="text-sm text-muted-foreground">Телефон</p>
                          <p className="font-medium">{order.customer_phone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Icon name={order.delivery_method === 'delivery' ? 'Truck' : 'Store'} size={20} className="text-primary mt-1" />
                        <div>
                          <p className="text-sm text-muted-foreground">Получение</p>
                          <p className="font-medium">
                            {order.delivery_method === 'delivery' ? 'Доставка' : 'Самовывоз'}
                          </p>
                          {order.delivery_address && (
                            <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {order.comments && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Комментарий к заказу:</p>
                        <p>{order.comments}</p>
                      </div>
                    )}

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Icon name="ShoppingBag" size={20} />
                        Состав заказа
                      </h4>
                      <div className="space-y-2">
                        {order.items && order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.quantity} × {item.product_price} ₽
                              </p>
                            </div>
                            <p className="font-semibold">{item.subtotal} ₽</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center text-xl font-bold">
                      <span>Итого:</span>
                      <span className="text-primary">{order.total_amount} ₽</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyOrders;