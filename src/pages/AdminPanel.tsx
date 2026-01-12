import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_URL = 'https://functions.poehali.dev/cd56016a-d013-4a6b-8794-fb405aa8ec96';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  category_name?: string;
  image_url: string;
  is_available: boolean;
}

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_method: string;
  delivery_address: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: any[];
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

const AdminPanel = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    new: { label: 'Новый', variant: 'default' },
    confirmed: { label: 'Подтверждён', variant: 'secondary' },
    preparing: { label: 'Готовится', variant: 'outline' },
    ready: { label: 'Готов', variant: 'default' },
    delivered: { label: 'Доставлен', variant: 'secondary' },
    cancelled: { label: 'Отменён', variant: 'destructive' }
  };

  useEffect(() => {
    loadProducts();
    loadOrders();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_URL}?action=products`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить товары",
        variant: "destructive",
      });
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_URL}?action=orders`);
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить заказы",
        variant: "destructive",
      });
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_URL}?action=categories`);
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productData = {
      id: editingProduct?.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      category_id: parseInt(formData.get('category_id') as string),
      image_url: formData.get('image_url') as string,
      is_available: formData.get('is_available') === 'on',
    };

    setLoading(true);
    
    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const response = await fetch(`${API_URL}?action=product`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        toast({
          title: "Успешно!",
          description: editingProduct ? "Товар обновлён" : "Товар создан",
        });
        setIsDialogOpen(false);
        setEditingProduct(null);
        loadProducts();
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить товар",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}?action=order_status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: "Успешно!",
          description: "Статус заказа обновлён",
        });
        loadOrders();
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Settings" className="text-primary" size={28} />
            <span className="text-2xl font-bold">Админ-панель</span>
          </div>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            <Icon name="Home" size={16} className="mr-2" />
            На главную
          </Button>
        </div>
      </header>

      <div className="container py-8">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="orders">Заказы</TabsTrigger>
            <TabsTrigger value="products">Товары</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Управление заказами</h2>
              <Button onClick={loadOrders}>
                <Icon name="RefreshCw" size={18} className="mr-2" />
                Обновить
              </Button>
            </div>

            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>Заказ #{order.id}</CardTitle>
                        <CardDescription className="mt-2">
                          {new Date(order.created_at).toLocaleString('ru-RU')}
                        </CardDescription>
                      </div>
                      <Badge variant={statusLabels[order.status]?.variant || 'default'}>
                        {statusLabels[order.status]?.label || order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Клиент</p>
                        <p className="font-medium">{order.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Телефон</p>
                        <p className="font-medium">{order.customer_phone}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{order.customer_email}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-lg font-bold">
                        Сумма: {order.total_amount} ₽
                      </div>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Новый</SelectItem>
                          <SelectItem value="confirmed">Подтверждён</SelectItem>
                          <SelectItem value="preparing">Готовится</SelectItem>
                          <SelectItem value="ready">Готов</SelectItem>
                          <SelectItem value="delivered">Доставлен</SelectItem>
                          <SelectItem value="cancelled">Отменён</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Управление товарами</h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingProduct(null)}>
                    <Icon name="Plus" size={18} className="mr-2" />
                    Добавить товар
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? 'Редактировать товар' : 'Новый товар'}
                    </DialogTitle>
                    <DialogDescription>
                      Заполните информацию о товаре
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveProduct} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Название</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={editingProduct?.name}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Описание</Label>
                      <Textarea
                        id="description"
                        name="description"
                        defaultValue={editingProduct?.description}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Цена (₽)</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          step="0.01"
                          defaultValue={editingProduct?.price}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category_id">Категория</Label>
                        <Select
                          name="category_id"
                          defaultValue={editingProduct?.category_id?.toString()}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите категорию" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image_url">URL изображения</Label>
                      <Input
                        id="image_url"
                        name="image_url"
                        type="url"
                        defaultValue={editingProduct?.image_url}
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_available"
                        name="is_available"
                        defaultChecked={editingProduct?.is_available ?? true}
                      />
                      <Label htmlFor="is_available">Товар доступен</Label>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Сохранение...' : 'Сохранить'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="shadow-lg">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <Badge variant={product.is_available ? 'default' : 'secondary'}>
                        {product.is_available ? 'В наличии' : 'Нет в наличии'}
                      </Badge>
                    </div>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{product.price} ₽</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingProduct(product);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Icon name="Edit" size={16} className="mr-2" />
                        Изменить
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
