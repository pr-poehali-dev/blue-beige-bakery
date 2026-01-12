import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { CartSheet } from '@/components/CartSheet';
import { useCart, Product } from '@/lib/cart';

const Index = () => {
  const { toast } = useToast();
  const { addItem, getTotalPrice, items } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState('delivery');
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const orderFormRef = useRef<HTMLDivElement>(null);

  const products = [
    {
      id: 1,
      name: 'Круассан классический',
      price: 180,
      category: 'croissants',
      description: 'Хрустящий французский круассан из слоёного теста',
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop'
    },
    {
      id: 2,
      name: 'Шоколадный торт',
      price: 2500,
      category: 'cakes',
      description: 'Нежный бисквитный торт с бельгийским шоколадом',
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'
    },
    {
      id: 3,
      name: 'Эклеры ассорти',
      price: 350,
      category: 'pastries',
      description: 'Французские пирожные с кремом разных вкусов',
      image: 'https://images.unsplash.com/photo-1612201142855-c337de87f556?w=400&h=300&fit=crop'
    },
    {
      id: 4,
      name: 'Ягодный тарт',
      price: 450,
      category: 'pastries',
      description: 'Песочная корзиночка со свежими ягодами и кремом',
      image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=300&fit=crop'
    },
    {
      id: 5,
      name: 'Медовик классический',
      price: 2200,
      category: 'cakes',
      description: 'Традиционный медовый торт с кремом',
      image: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400&h=300&fit=crop'
    },
    {
      id: 6,
      name: 'Багет французский',
      price: 120,
      category: 'bread',
      description: 'Хрустящий багет на закваске',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop'
    }
  ];

  const galleryImages = [
    'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1557925923-33b27c739f42?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1587241321921-91a834d82b01?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1517427294546-5aa121f68e8a?w=600&h=400&fit=crop'
  ];

  const blogPosts = [
    {
      id: 1,
      title: 'Секреты идеального круассана',
      date: '15 января 2026',
      excerpt: 'Как мы создаём наши фирменные круассаны с 72 слоями теста',
      image: 'https://images.unsplash.com/photo-1623334044303-241021148842?w=400&h=250&fit=crop'
    },
    {
      id: 2,
      title: 'Новая коллекция весенних тортов',
      date: '10 января 2026',
      excerpt: 'Встречайте обновлённое меню с сезонными вкусами',
      image: 'https://images.unsplash.com/photo-1588195538326-c5aeda9e6e0d?w=400&h=250&fit=crop'
    },
    {
      id: 3,
      title: 'Рецепт домашнего хлеба',
      date: '5 января 2026',
      excerpt: 'Простой рецепт хлеба на закваске для начинающих',
      image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=250&fit=crop'
    }
  ];

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast({
      title: "Добавлено в корзину!",
      description: `${product.name} добавлен в корзину`,
    });
  };

  const handleCheckout = () => {
    setIsOrderFormOpen(true);
    setTimeout(() => {
      orderFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleOrderSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const orderData = {
      customer_name: formData.get('name') as string,
      customer_phone: formData.get('phone') as string,
      customer_email: formData.get('email') as string,
      delivery_method: deliveryMethod,
      delivery_address: deliveryMethod === 'delivery' ? formData.get('address') as string : '',
      comments: formData.get('comments') as string,
      items: items,
      total_amount: getTotalPrice(),
    };

    try {
      const response = await fetch('https://functions.poehali.dev/19679602-8109-4a27-ae20-8fb923d65b8b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        toast({
          title: "Заказ принят!",
          description: "Мы отправили подтверждение на вашу почту",
        });
        e.currentTarget.reset();
        setIsOrderFormOpen(false);
      } else {
        throw new Error('Ошибка отправки заказа');
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить заказ. Попробуйте позже.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (items.length > 0) {
      setIsOrderFormOpen(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Cake" className="text-primary" size={28} />
            <span className="text-2xl font-bold">Сладкий рай</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <a href="#catalog" className="text-foreground/80 hover:text-foreground transition-colors">Каталог</a>
            <a href="#about" className="text-foreground/80 hover:text-foreground transition-colors">О нас</a>
            <a href="#gallery" className="text-foreground/80 hover:text-foreground transition-colors">Галерея</a>
            <a href="#order" className="text-foreground/80 hover:text-foreground transition-colors">Заказать</a>
            <a href="#blog" className="text-foreground/80 hover:text-foreground transition-colors">Блог</a>
            <a href="#contacts" className="text-foreground/80 hover:text-foreground transition-colors">Контакты</a>
          </nav>
          <div className="flex items-center gap-2">
            <CartSheet onCheckout={handleCheckout} />
            <Button size="sm">
              <Icon name="Phone" size={16} className="mr-2" />
              Позвонить
            </Button>
          </div>
        </div>
      </header>

      <section className="relative py-24 md:py-32 bg-gradient-to-br from-accent via-background to-muted overflow-hidden">
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground">
              Свежая выпечка каждый день
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Авторские торты, ароматный хлеб и французские десерты с доставкой по городу
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="animate-scale-in">
                <Icon name="ShoppingBag" size={20} className="mr-2" />
                Посмотреть каталог
              </Button>
              <Button size="lg" variant="outline" className="animate-scale-in">
                <Icon name="Gift" size={20} className="mr-2" />
                Заказать торт
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(14,165,233,0.1),transparent)]"></div>
      </section>

      <section id="catalog" className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Наш каталог</h2>
            <p className="text-xl text-muted-foreground">Выберите что-то вкусное для себя</p>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5 mb-12">
              <TabsTrigger value="all">Всё</TabsTrigger>
              <TabsTrigger value="croissants">Круассаны</TabsTrigger>
              <TabsTrigger value="cakes">Торты</TabsTrigger>
              <TabsTrigger value="pastries">Десерты</TabsTrigger>
              <TabsTrigger value="bread">Хлеб</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-2xl">{product.name}</CardTitle>
                      <Badge variant="secondary" className="text-lg font-semibold">{product.price} ₽</Badge>
                    </div>
                    <CardDescription className="text-base">{product.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button className="w-full" onClick={() => handleAddToCart(product)}>
                      <Icon name="ShoppingCart" size={18} className="mr-2" />
                      В корзину
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </TabsContent>

            {['croissants', 'cakes', 'pastries', 'bread'].map((category) => (
              <TabsContent key={category} value={category} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.filter(p => p.category === category).map((product, index) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-2xl">{product.name}</CardTitle>
                        <Badge variant="secondary" className="text-lg font-semibold">{product.price} ₽</Badge>
                      </div>
                      <CardDescription className="text-base">{product.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button className="w-full" onClick={() => handleAddToCart(product)}>
                        <Icon name="ShoppingCart" size={18} className="mr-2" />
                        В корзину
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      <section id="about" className="py-20 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Наша история</h2>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  Кондитерская «Сладкий рай» начала свой путь в 2015 году с небольшой пекарни на окраине города. 
                  Тогда мы были всего лишь командой из трёх человек с большой мечтой — делать самую вкусную выпечку в городе.
                </p>
                <p>
                  Сегодня мы выросли в любимую кондитерскую с командой из 25 мастеров. Каждый день мы печём 
                  более 500 изделий, используя только натуральные ингредиенты и проверенные рецепты.
                </p>
                <p>
                  Наши кондитеры прошли обучение в Париже, Вене и Милане, чтобы привезти вам лучшие европейские техники 
                  и соединить их с традициями домашней выпечки.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">9+</div>
                  <div className="text-sm text-muted-foreground">лет опыта</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">500+</div>
                  <div className="text-sm text-muted-foreground">изделий в день</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">25</div>
                  <div className="text-sm text-muted-foreground">мастеров</div>
                </div>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <img 
                src="https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?w=600&h=700&fit=crop" 
                alt="Наша кондитерская" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="gallery" className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Галерея наших работ</h2>
            <p className="text-xl text-muted-foreground">Каждое изделие — произведение кондитерского искусства</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleryImages.map((image, index) => (
              <div 
                key={index} 
                className="aspect-[3/2] overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-fade-in cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <img src={image} alt={`Галерея ${index + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="order" className="py-20 bg-gradient-to-br from-primary/5 to-accent/10" ref={orderFormRef}>
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Оформить заказ</h2>
            <p className="text-xl text-muted-foreground">Заполните форму, и мы свяжемся с вами для уточнения деталей</p>
          </div>

          <Card className="shadow-2xl animate-scale-in">
            <CardHeader>
              <CardTitle className="text-2xl">Форма заказа</CardTitle>
              <CardDescription>Все поля обязательны для заполнения</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleOrderSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ваше имя</Label>
                    <Input id="name" placeholder="Иван Иванов" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон</Label>
                    <Input id="phone" type="tel" placeholder="+7 (999) 123-45-67" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="ivan@example.com" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product">Что хотите заказать?</Label>
                  <Select required>
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Выберите товар" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cake">Торт на заказ</SelectItem>
                      <SelectItem value="croissants">Круассаны</SelectItem>
                      <SelectItem value="pastries">Десерты</SelectItem>
                      <SelectItem value="bread">Хлеб</SelectItem>
                      <SelectItem value="other">Другое</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Способ получения</Label>
                  <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="delivery" id="delivery" />
                      <Label htmlFor="delivery" className="cursor-pointer flex-1">
                        <div className="flex items-center gap-2">
                          <Icon name="Truck" size={20} className="text-primary" />
                          <div>
                            <div className="font-medium">Доставка курьером</div>
                            <div className="text-sm text-muted-foreground">Бесплатно от 2000 ₽</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="pickup" id="pickup" />
                      <Label htmlFor="pickup" className="cursor-pointer flex-1">
                        <div className="flex items-center gap-2">
                          <Icon name="Store" size={20} className="text-primary" />
                          <div>
                            <div className="font-medium">Самовывоз из пекарни</div>
                            <div className="text-sm text-muted-foreground">Бесплатно всегда</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {deliveryMethod === 'delivery' && (
                  <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="address">Адрес доставки</Label>
                    <Input id="address" placeholder="Улица, дом, квартира" required />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="comments">Комментарий к заказу</Label>
                  <Textarea id="comments" placeholder="Особые пожелания, время доставки и т.д." rows={4} />
                </div>

                <Button type="submit" size="lg" className="w-full">
                  <Icon name="Send" size={20} className="mr-2" />
                  Отправить заказ
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="blog" className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Наш блог</h2>
            <p className="text-xl text-muted-foreground">Рецепты, советы и новости из мира кондитерского искусства</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in cursor-pointer" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="aspect-[16/9] overflow-hidden">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Icon name="Calendar" size={16} />
                    {post.date}
                  </div>
                  <CardTitle className="text-xl">{post.title}</CardTitle>
                  <CardDescription className="text-base">{post.excerpt}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="ghost" className="w-full">
                    Читать далее
                    <Icon name="ArrowRight" size={16} className="ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="contacts" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Контакты</h2>
            <p className="text-xl text-muted-foreground">Приходите к нам на чашку кофе и свежую выпечку</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Icon name="MapPin" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Адрес</h3>
                  <p className="text-muted-foreground">ул. Пушкина, 12, Москва, 101000</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Icon name="Phone" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Телефон</h3>
                  <p className="text-muted-foreground">+7 (495) 123-45-67</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Icon name="Mail" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Email</h3>
                  <p className="text-muted-foreground">info@sladkiy-rai.ru</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Icon name="Clock" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Режим работы</h3>
                  <p className="text-muted-foreground">Пн-Вс: 8:00 — 22:00</p>
                </div>
              </div>
            </div>
            <div className="aspect-square rounded-xl overflow-hidden shadow-xl animate-scale-in">
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&h=600&fit=crop" 
                alt="Карта" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-foreground/5 border-t py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Cake" className="text-primary" size={24} />
                <span className="text-xl font-bold">Сладкий рай</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Авторская кондитерская-пекарня с европейским качеством
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Навигация</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div><a href="#catalog" className="hover:text-foreground transition-colors">Каталог</a></div>
                <div><a href="#about" className="hover:text-foreground transition-colors">О нас</a></div>
                <div><a href="#gallery" className="hover:text-foreground transition-colors">Галерея</a></div>
                <div><a href="#order" className="hover:text-foreground transition-colors">Заказать</a></div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Информация</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Доставка и оплата</div>
                <div>Политика конфиденциальности</div>
                <div>Вакансии</div>
                <div>Отзывы</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Соцсети</h4>
              <div className="flex gap-3">
                <Button size="icon" variant="outline">
                  <Icon name="Instagram" size={20} />
                </Button>
                <Button size="icon" variant="outline">
                  <Icon name="Facebook" size={20} />
                </Button>
                <Button size="icon" variant="outline">
                  <Icon name="Twitter" size={20} />
                </Button>
              </div>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 Сладкий рай. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;