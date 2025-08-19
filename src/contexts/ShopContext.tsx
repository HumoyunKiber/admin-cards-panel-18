import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient, Shop } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface ShopContextType {
  shops: Shop[];
  isLoading: boolean;
  error: string | null;
  setShops: React.Dispatch<React.SetStateAction<Shop[]>>;
  fetchShops: () => Promise<Shop[]>;
  createShop: (shopData: Omit<Shop, 'id'>) => Promise<boolean>;
  updateShop: (shopId: string, shopData: Partial<Shop>) => Promise<boolean>;
  deleteShop: (shopId: string) => Promise<boolean>;
  getActiveShopsCount: () => number;
  getShopsByRegion: () => { [key: string]: number };
  getTotalShopsCount: () => number;
  getShopSalesStats: (shopId: string, simCards: any[]) => { sold: number; available: number; total: number };
  getAllShopSalesStats: (simCards: any[]) => { [shopId: string]: { sold: number; available: number; total: number } };
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchShops = async (): Promise<Shop[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getShops();
      setShops(data);
      return data;
    } catch (error) {
      const errorMessage = 'Magazinlarni yuklashda xatolik yuz berdi';
      setError(errorMessage);
      toast({
        title: "Xato!",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createShop = async (shopData: Omit<Shop, 'id'>): Promise<boolean> => {
    try {
      const newShop = await apiClient.createShop(shopData);
      setShops(prev => [...prev, newShop]);
      toast({
        title: "Muvaffaqiyat!",
        description: "Yangi magazin qo'shildi",
      });
      return true;
    } catch (error) {
      toast({
        title: "Xato!",
        description: "Magazin qo'shishda xatolik yuz berdi",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateShop = async (shopId: string, shopData: Partial<Shop>): Promise<boolean> => {
    try {
      const updatedShop = await apiClient.updateShop(shopId, shopData);
      setShops(prev => prev.map(shop => shop.id === shopId ? updatedShop : shop));
      toast({
        title: "Muvaffaqiyat!",
        description: "Magazin ma'lumotlari yangilandi",
      });
      return true;
    } catch (error) {
      toast({
        title: "Xato!",
        description: "Magazin yangilashda xatolik yuz berdi",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteShop = async (shopId: string): Promise<boolean> => {
    try {
      await apiClient.deleteShop(shopId);
      setShops(prev => prev.filter(shop => shop.id !== shopId));
      toast({
        title: "Muvaffaqiyat!",
        description: "Magazin o'chirildi",
      });
      return true;
    } catch (error) {
      toast({
        title: "Xato!",
        description: "Magazin o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const getActiveShopsCount = (): number => {
    return shops.filter(shop => shop.status === 'active').length;
  };

  const getTotalShopsCount = (): number => {
    return shops.length;
  };

  const getShopsByRegion = (): { [key: string]: number } => {
    const regionCount: { [key: string]: number } = {};
    shops.forEach(shop => {
      regionCount[shop.region] = (regionCount[shop.region] || 0) + 1;
    });
    return regionCount;
  };

  const getShopSalesStats = (shopId: string, simCards: any[]) => {
    const shopSimCards = simCards.filter(card => card.assignedTo === shopId);
    const sold = shopSimCards.filter(card => card.status === 'sold').length;
    const available = shopSimCards.filter(card => card.status === 'assigned').length;
    
    return {
      sold,
      available,
      total: shopSimCards.length
    };
  };

  const getAllShopSalesStats = (simCards: any[]) => {
    const stats: { [shopId: string]: { sold: number; available: number; total: number } } = {};
    
    shops.forEach(shop => {
      stats[shop.id] = getShopSalesStats(shop.id, simCards);
    });
    
    return stats;
  };

  return (
    <ShopContext.Provider value={{
      shops,
      isLoading,
      error,
      setShops,
      fetchShops,
      createShop,
      updateShop,
      deleteShop,
      getActiveShopsCount,
      getShopsByRegion,
      getTotalShopsCount,
      getShopSalesStats,
      getAllShopSalesStats
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};