import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MapLocationPicker from '@/components/admin/MapLocationPicker';
import { useSimCard } from '@/contexts/SimCardContext';
import { useShop } from '@/contexts/ShopContext';

interface Shop {
  id: string;
  name: string;
  ownerName: string;
  ownerPhone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  status: 'active' | 'inactive';
  region: string;
  assignedSimCards: string[]; // Array of SIM card IDs
  addedDate: string;
}

const Shops = () => {
  const { toast } = useToast();
  const { assignSimCardsToShop, getAvailableSimCardsCount, simCards } = useSimCard();
  const { shops, createShop, deleteShop, getAllShopSalesStats, fetchShops, isLoading } = useShop();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    ownerPhone: '',
    address: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    region: '',
    simCardCount: 0,
    status: 'active' as 'active' | 'inactive'
  });
  
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [showShopDetails, setShowShopDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if enough SIM cards are available
    const availableCount = getAvailableSimCardsCount();
    if (formData.simCardCount > availableCount) {
      toast({
        title: "Xatolik!",
        description: `Bazada yetarli simkarta yo'q. Mavjud: ${availableCount} ta, so'ralgan: ${formData.simCardCount} ta`,
        variant: "destructive"
      });
      return;
    }
    
    const shopData = {
      name: formData.name,
      ownerName: formData.ownerName,
      ownerPhone: formData.ownerPhone,
      address: formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude,
      status: formData.status,
      region: formData.region,
      assignedSimCards: [],
      addedDate: new Date().toISOString().split('T')[0]
    };

    // API orqali magazin yaratish
    const success = await createShop(shopData);
    
    if (success) {
      // Simkartalarni biriktirish
      if (formData.simCardCount > 0) {
        // Yangi qo'shilgan magazinni topish uchun shops ro'yxatini yangilaymiz
        const updatedShops = await fetchShops();
        const latestShop = updatedShops.find(shop => 
          shop.name === formData.name && 
          shop.ownerName === formData.ownerName
        );
        
        if (latestShop) {
          await assignSimCardsToShop(latestShop.id, latestShop.name, formData.simCardCount);
        }
      }
      
      setFormData({ 
        name: '', 
        ownerName: '', 
        ownerPhone: '', 
        address: '', 
        latitude: undefined, 
        longitude: undefined, 
        region: '', 
        simCardCount: 0, 
        status: 'active' 
      });
      setShowForm(false);
      setShowLocationPicker(false);
      
      // Ma'lumotlarni yangilash
      await fetchShops();
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteShop(id);
    if (success) {
      await fetchShops(); // Ma'lumotlarni yangilash
    }
  };

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Har bir magazin uchun sotish statistikasi
  const shopSalesStats = getAllShopSalesStats(simCards);

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge className="bg-green-100 text-green-800">Faol</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800">Nofaol</Badge>;
  };

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setFormData({
      ...formData,
      address: location.address,
      latitude: location.lat,
      longitude: location.lng
    });
    setShowLocationPicker(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Magazinlar</h1>
          <p className="text-muted-foreground">Magazin qo'shish</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary-glow"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yangi magazin
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-foreground">Yangi magazin qo'shish</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Magazin nomi</Label>
                  <Input
                    id="name"
                    placeholder="Magazin nomi"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Egasining ismi</Label>
                  <Input
                    id="ownerName"
                    placeholder="Magazin egasining to'liq ismi"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerPhone">Egasining telefoni</Label>
                  <Input
                    id="ownerPhone"
                    placeholder="+998 90 123 45 67"
                    value={formData.ownerPhone}
                    onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="simCardCount">Simkarta soni</Label>
                  <Input
                    id="simCardCount"
                    type="number"
                    min="0"
                    max={getAvailableSimCardsCount()}
                    placeholder="Nechta simkarta biriktirish"
                    value={formData.simCardCount}
                    onChange={(e) => setFormData({ ...formData, simCardCount: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Bazadan nechta simkarta biriktirish kerak (Mavjud: {getAvailableSimCardsCount()} ta)
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Manzil va lokatsiya</Label>
                <div className="space-y-2">
                  <Textarea
                    id="address"
                    placeholder="To'liq manzil"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowLocationPicker(true)}
                    className="w-full"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Xaritadan lokatsiya tanlash
                  </Button>
                  {formData.latitude && formData.longitude && (
                    <p className="text-sm text-muted-foreground">
                      Koordinatalar: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Viloyat/hudud</Label>
                  <Select required onValueChange={(value) => setFormData({ ...formData, region: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Viloyatni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Toshkent">Toshkent</SelectItem>
                      <SelectItem value="Samarqand">Samarqand</SelectItem>
                      <SelectItem value="Buxoro">Buxoro</SelectItem>
                      <SelectItem value="Andijon">Andijon</SelectItem>
                      <SelectItem value="Farg'ona">Farg'ona</SelectItem>
                      <SelectItem value="Namangan">Namangan</SelectItem>
                      <SelectItem value="Qashqadaryo">Qashqadaryo</SelectItem>
                      <SelectItem value="Surxondaryo">Surxondaryo</SelectItem>
                      <SelectItem value="Sirdaryo">Sirdaryo</SelectItem>
                      <SelectItem value="Jizzax">Jizzax</SelectItem>
                      <SelectItem value="Navoiy">Navoiy</SelectItem>
                      <SelectItem value="Xorazm">Xorazm</SelectItem>
                      <SelectItem value="Qoraqalpog'iston">Qoraqalpog'iston</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Holat</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Holatni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Faol</SelectItem>
                      <SelectItem value="inactive">Nofaol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-primary hover:bg-primary-glow">
                  Qo'shish
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Bekor qilish
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search and Table */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">Magazinlar ro'yxati</CardTitle>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Qidiruv..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Magazin</TableHead>
                <TableHead>Egasi</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Manzil</TableHead>
                <TableHead>Simkarta soni</TableHead>
                <TableHead>Sotilgan</TableHead>
                <TableHead>Sotilmagan</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead className="w-[150px]">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShops.map((shop) => {
                const stats = shopSalesStats[shop.id] || { sold: 0, available: 0, total: 0 };
                return (
                  <TableRow 
                    key={shop.id} 
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => {
                      setSelectedShop(shop);
                      setShowShopDetails(true);
                    }}
                  >
                    <TableCell className="font-medium">{shop.name}</TableCell>
                    <TableCell>{shop.ownerName}</TableCell>
                    <TableCell>{shop.ownerPhone}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {shop.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {stats.total} ta
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        {stats.sold} ta
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-orange-100 text-orange-800">
                        {stats.available} ta
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(shop.status)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(shop.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredShops.length === 0 && (
        <Card className="shadow-card border-0">
          <CardContent className="p-12 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <p className="text-muted-foreground">
              Hech qanday magazin topilmadi
            </p>
          </CardContent>
        </Card>
      )}

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Magazin lokatsiyasini tanlang</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowLocationPicker(false)}
                >
                  ✕
                </Button>
              </div>
              <MapLocationPicker 
                onLocationSelect={handleLocationSelect}
                initialLocation={formData.latitude && formData.longitude ? {
                  lat: formData.latitude,
                  lng: formData.longitude
                } : undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* Shop Details Modal */}
      {showShopDetails && selectedShop && (
        <Card className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">{selectedShop.name} - Ma'lumotlar</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowShopDetails(false)}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Magazin nomi</Label>
                  <p className="text-foreground">{selectedShop.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Egasining ismi</Label>
                  <p className="text-foreground">{selectedShop.ownerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Telefon</Label>
                  <p className="text-foreground">{selectedShop.ownerPhone}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Manzil</Label>
                <p className="text-foreground">{selectedShop.address}</p>
                {selectedShop.latitude && selectedShop.longitude && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Koordinatalar: {selectedShop.latitude.toFixed(6)}, {selectedShop.longitude.toFixed(6)}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Simkarta statistikasi</Label>
                {(() => {
                  const stats = shopSalesStats[selectedShop.id] || { sold: 0, available: 0, total: 0 };
                  return (
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="text-xl font-bold text-blue-600">{stats.total}</div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">Jami</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="text-xl font-bold text-green-600">{stats.sold}</div>
                        <div className="text-sm text-green-700 dark:text-green-300">Sotilgan</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <div className="text-xl font-bold text-orange-600">{stats.available}</div>
                        <div className="text-sm text-orange-700 dark:text-orange-300">Sotilmagan</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <Label className="text-sm font-medium">Biriktirilgan simkarta kodlari</Label>
                {(() => {
                  const shopSimCards = simCards.filter(card => card.assignedTo === selectedShop.id);
                  return shopSimCards.length > 0 ? (
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {shopSimCards.map((card) => (
                        <div key={card.id} className="flex items-center justify-between p-2 bg-accent/20 rounded">
                          <span className="font-mono text-sm">{card.code}</span>
                          <Badge 
                            className={
                              card.status === 'sold' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800'
                            }
                          >
                            {card.status === 'sold' ? 'Sotilgan' : 'Mavjud'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">Hech qanday simkarta biriktirilmagan</p>
                  );
                })()}
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowShopDetails(false)}>
                  Yopish
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Shops;