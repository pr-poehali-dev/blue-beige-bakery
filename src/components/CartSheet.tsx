import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { useCart } from '@/lib/cart';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CartSheetProps {
  onCheckout?: () => void;
}

export const CartSheet = ({ onCheckout }: CartSheetProps) => {
  const { items, removeItem, updateQuantity, getTotalItems, getTotalPrice, clearCart } = useCart();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Icon name="ShoppingCart" size={18} />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Icon name="ShoppingBag" size={24} />
            Корзина
          </SheetTitle>
          <SheetDescription>
            {totalItems > 0 ? `${totalItems} ${totalItems === 1 ? 'товар' : totalItems < 5 ? 'товара' : 'товаров'} в корзине` : 'Корзина пуста'}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
            <Icon name="ShoppingCart" size={64} className="text-muted-foreground" />
            <p className="text-lg text-muted-foreground">Ваша корзина пуста</p>
            <p className="text-sm text-muted-foreground">Добавьте товары из каталога</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[calc(100vh-280px)] pr-4 mt-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.price} ₽</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Icon name="Minus" size={14} />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Icon name="Plus" size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 ml-auto"
                          onClick={() => removeItem(item.id)}
                        >
                          <Icon name="Trash2" size={14} className="text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{item.price * item.quantity} ₽</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-6 space-y-4">
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Подытог</span>
                  <span className="font-medium">{totalPrice} ₽</span>
                </div>
                {totalPrice >= 2000 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Доставка</span>
                    <span className="font-medium text-green-600">Бесплатно</span>
                  </div>
                )}
                {totalPrice < 2000 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Доставка</span>
                    <span className="font-medium">300 ₽</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Итого</span>
                  <span>{totalPrice < 2000 ? totalPrice + 300 : totalPrice} ₽</span>
                </div>
              </div>

              <SheetFooter className="flex-col gap-2">
                <Button size="lg" className="w-full" onClick={handleCheckout}>
                  <Icon name="CreditCard" size={18} className="mr-2" />
                  Оформить заказ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={clearCart}
                >
                  <Icon name="Trash2" size={16} className="mr-2" />
                  Очистить корзину
                </Button>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
