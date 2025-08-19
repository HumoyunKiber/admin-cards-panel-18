import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiClient, SimCard } from '@/services/api';

interface SimCardContextType {
  simCards: SimCard[];
  isLoading: boolean;
  error: string | null;
  setSimCards: React.Dispatch<React.SetStateAction<SimCard[]>>;
  fetchSimCards: () => Promise<void>;
  createSimCard: (simCardData: Omit<SimCard, 'id'>) => Promise<boolean>;
  updateSimCard: (simCardId: string, simCardData: Partial<SimCard>) => Promise<boolean>;
  deleteSimCard: (simCardId: string) => Promise<boolean>;
  assignSimCardsToShop: (shopId: string, shopName: string, count: number) => Promise<boolean>;
  getAvailableSimCardsCount: () => number;
  lastAutoCheck: string | null;
  autoCheckStatus: 'idle' | 'checking' | 'error';
}

const SimCardContext = createContext<SimCardContextType | undefined>(undefined);

export const SimCardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [simCards, setSimCards] = useState<SimCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAutoCheck, setLastAutoCheck] = useState<string | null>(null);
  const [autoCheckStatus, setAutoCheckStatus] = useState<'idle' | 'checking' | 'error'>('idle');

  const fetchSimCards = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getSimCards();
      setSimCards(data);
    } catch (error) {
      const errorMessage = 'Simkartalarni yuklashda xatolik yuz berdi';
      setError(errorMessage);
      toast({
        title: "Xato!",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createSimCard = async (simCardData: Omit<SimCard, 'id'>): Promise<boolean> => {
    try {
      const newSimCard = await apiClient.createSimCard(simCardData);
      setSimCards(prev => [...prev, newSimCard]);
      toast({
        title: "Muvaffaqiyat!",
        description: "Yangi simkarta qo'shildi",
      });
      return true;
    } catch (error) {
      toast({
        title: "Xato!",
        description: "Simkarta qo'shishda xatolik yuz berdi",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateSimCard = async (simCardId: string, simCardData: Partial<SimCard>): Promise<boolean> => {
    try {
      const updatedSimCard = await apiClient.updateSimCard(simCardId, simCardData);
      setSimCards(prev => prev.map(card => card.id === simCardId ? updatedSimCard : card));
      toast({
        title: "Muvaffaqiyat!",
        description: "Simkarta ma'lumotlari yangilandi",
      });
      return true;
    } catch (error) {
      toast({
        title: "Xato!",
        description: "Simkarta yangilashda xatolik yuz berdi",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteSimCard = async (simCardId: string): Promise<boolean> => {
    try {
      await apiClient.deleteSimCard(simCardId);
      setSimCards(prev => prev.filter(card => card.id !== simCardId));
      toast({
        title: "Muvaffaqiyat!",
        description: "Simkarta o'chirildi",
      });
      return true;
    } catch (error) {
      toast({
        title: "Xato!",
        description: "Simkarta o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
      return false;
    }
  };

  const assignSimCardsToShop = async (shopId: string, shopName: string, count: number): Promise<boolean> => {
    try {
      const response = await apiClient.assignSimCardsToShop(shopId, count);
      
      if (response.success) {
        // Update local state with assigned cards
        setSimCards(prev => 
          prev.map(card => {
            const assignedCard = response.assignedCards.find(assigned => assigned.id === card.id);
            if (assignedCard) {
              return {
                ...card,
                status: 'assigned' as const,
                assignedTo: shopId,
                assignedShopName: shopName
              };
            }
            return card;
          })
        );

        toast({
          title: "Muvaffaqiyat!",
          description: `${count} ta simkarta magazinga tayinlandi`,
        });
        return true;
      }
      return false;
    } catch (error) {
      toast({
        title: "Xato!",
        description: "Simkartalarni tayinlashda xatolik yuz berdi",
        variant: "destructive",
      });
      return false;
    }
  };

  const getAvailableSimCardsCount = (): number => {
    return simCards.filter(card => card.status === 'available').length;
  };

  useEffect(() => {
    fetchSimCards();
  }, []);

  // Avtomatik tekshirish intervali (5 daqiqa) - faqat birinchi yuklanganda ishga tushadi
  useEffect(() => {
    const checkSimCards = async () => {
      if (simCards.length === 0) return; // Agar simkartalar bo'lmasa tekshirmaymiz
      
      setAutoCheckStatus('checking');
      
      try {
        const response = await apiClient.autoCheckSimCards(simCards);
        
        // Simkartalar holatini yangilash
        const updatedSimCards = simCards.map(simCard => {
          const result = response.results.find((r: any) => r.simCardId === simCard.id);
          if (result) {
            return {
              ...simCard,
              status: result.status,
              saleDate: result.saleDate,
              lastChecked: result.lastChecked
            };
          }
          return simCard;
        });

        setSimCards(updatedSimCards);
        setLastAutoCheck(response.timestamp);
        setAutoCheckStatus('idle');

        // Yangi sotilgan simkartalar haqida xabar berish
        const newlySold = response.results.filter((r: any) => 
          r.isSold && simCards.find(s => s.id === r.simCardId)?.status !== 'sold'
        );

        if (newlySold.length > 0) {
          toast({
            title: "Yangi sotuvlar!",
            description: `${newlySold.length} ta simkarta sotildi`,
          });
        }

      } catch (error) {
        console.error('Avtomatik tekshirishda xatolik:', error);
        setAutoCheckStatus('error');
        toast({
          title: "Xato!",
          description: "Avtomatik tekshirishda xatolik yuz berdi",
          variant: "destructive",
        });
      }
    };

    // Faqat simkartalar mavjud bo'lganda va birinchi marta yuklanganda
    let interval: NodeJS.Timeout | null = null;
    
    if (simCards.length > 0 && !isLoading) {
      // Darhol birinchi tekshiruvni boshlash
      checkSimCards();
      
      // Har 5 daqiqada tekshirish
      interval = setInterval(checkSimCards, 5 * 60 * 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [simCards.length, isLoading]); // Faqat simCards.length va isLoading-ga bog'liq


  return (
    <SimCardContext.Provider value={{
      simCards,
      isLoading,
      error,
      setSimCards,
      fetchSimCards,
      createSimCard,
      updateSimCard,
      deleteSimCard,
      assignSimCardsToShop,
      getAvailableSimCardsCount,
      lastAutoCheck,
      autoCheckStatus,
    }}>
      {children}
    </SimCardContext.Provider>
  );
};

export const useSimCard = () => {
  const context = useContext(SimCardContext);
  if (context === undefined) {
    throw new Error('useSimCard must be used within a SimCardProvider');
  }
  return context;
};