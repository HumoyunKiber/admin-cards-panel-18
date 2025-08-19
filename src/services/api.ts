const API_BASE_URL = 'http://141.136.42.126:9022';

// API client class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Access-Control-Allow-Origin': '*',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(`Server bilan aloqa o'rnatilmadi. Server ishlayotganligini tekshiring: ${this.baseURL}`);
      }
      
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials: { username: string; password: string }) {
    return this.request<{ success: boolean; token?: string; user?: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    return this.request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    });
  }

  // Shop endpoints
  async getShops() {
    return this.request<any[]>('/shops');
  }

  async createShop(shopData: any) {
    return this.request<any>('/shops', {
      method: 'POST',
      body: JSON.stringify(shopData),
    });
  }

  async updateShop(shopId: string, shopData: any) {
    return this.request<any>(`/shops/${shopId}`, {
      method: 'PUT',
      body: JSON.stringify(shopData),
    });
  }

  async deleteShop(shopId: string) {
    return this.request<{ success: boolean }>(`/shops/${shopId}`, {
      method: 'DELETE',
    });
  }

  async getShopStats(shopId: string) {
    return this.request<any>(`/shops/${shopId}/stats`);
  }

  // SimCard endpoints
  async getSimCards() {
    return this.request<any[]>('/simcards');
  }

  async createSimCard(simCardData: any) {
    return this.request<any>('/simcards', {
      method: 'POST',
      body: JSON.stringify(simCardData),
    });
  }

  async updateSimCard(simCardId: string, simCardData: any) {
    return this.request<any>(`/simcards/${simCardId}`, {
      method: 'PUT',
      body: JSON.stringify(simCardData),
    });
  }

  async deleteSimCard(simCardId: string) {
    return this.request<{ success: boolean }>(`/simcards/${simCardId}`, {
      method: 'DELETE',
    });
  }

  async assignSimCardsToShop(shopId: string, count: number) {
    return this.request<{ success: boolean; assignedCards: any[] }>('/simcards/assign', {
      method: 'POST',
      body: JSON.stringify({ shopId, count }),
    });
  }

  async checkSimCardStatus(simCardId: string) {
    return this.request<any>(`/simcards/${simCardId}/check-status`);
  }

  async autoCheckSimCards(simCards: any[]) {
    return this.request<{ results: any[]; timestamp: string }>('/simcards/auto-check', {
      method: 'POST',
      body: JSON.stringify({ simCards }),
    });
  }

  // Statistics endpoints
  async getStatistics() {
    return this.request<{
      totalShops: number;
      activeShops: number;
      totalSimCards: number;
      availableSimCards: number;
      assignedSimCards: number;
      soldSimCards: number;
      regionStats: { [key: string]: number };
      salesByDate: { [key: string]: number };
    }>('/statistics');
  }

  async getShopSalesStats() {
    return this.request<{ [shopId: string]: { sold: number; available: number; total: number } }>('/statistics/shops');
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export types
export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  ownerPhone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  status: 'active' | 'inactive';
  region: string;
  assignedSimCards: string[];
  addedDate: string;
}

export interface SimCard {
  id: string;
  code: string;
  status: 'available' | 'assigned' | 'sold';
  assignedTo?: string;
  assignedShopName?: string;
  addedDate: string;
  saleDate?: string;
  lastChecked?: string;
}

export interface Statistics {
  totalShops: number;
  activeShops: number;
  totalSimCards: number;
  availableSimCards: number;
  assignedSimCards: number;
  soldSimCards: number;
  regionStats: { [key: string]: number };
  salesByDate: { [key: string]: number };
}