import { apiClient, Statistics } from './api';

class StatisticsService {
  async getStatistics(): Promise<Statistics> {
    try {
      return await apiClient.getStatistics();
    } catch (error) {
      console.error('Statistics service error:', error);
      throw error;
    }
  }

  async getShopSalesStats(): Promise<{ [shopId: string]: { sold: number; available: number; total: number } }> {
    try {
      return await apiClient.getShopSalesStats();
    } catch (error) {
      console.error('Shop sales stats service error:', error);
      throw error;
    }
  }
}

export const statisticsService = new StatisticsService();