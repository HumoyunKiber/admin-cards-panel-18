import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, CreditCard, Store } from 'lucide-react';
import { useSimCard } from '@/contexts/SimCardContext';
import { useShop } from '@/contexts/ShopContext';
import { statisticsService } from '@/services/statisticsService';
import LoadingSpinner from '@/components/LoadingSpinner';

const Statistics = () => {
  const { simCards, isLoading: simCardsLoading } = useSimCard();
  const { shops, isLoading: shopsLoading, getActiveShopsCount, getShopsByRegion, getTotalShopsCount } = useShop();
  const [statistics, setStatistics] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const fetchStatistics = async () => {
      setStatsLoading(true);
      try {
        const stats = await statisticsService.getStatistics();
        setStatistics(stats);
      } catch (error) {
        console.error('Statistics fetch error:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const isLoading = simCardsLoading || shopsLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Statistika yuklanmoqda..." />
      </div>
    );
  }

  // Real data calculation
  const totalSimCards = simCards.length;
  const availableSimCards = simCards.filter(card => card.status === 'available').length;
  const assignedSimCards = simCards.filter(card => card.status === 'assigned').length;
  const activeShops = getActiveShopsCount();
  const totalShops = getTotalShopsCount();
  const shopsByRegion = getShopsByRegion();

  const statsData = [
    { name: 'Yanv', simcards: 120, shops: 15 },
    { name: 'Fev', simcards: 150, shops: 18 },
    { name: 'Mar', simcards: 180, shops: 22 },
    { name: 'Apr', simcards: 220, shops: 25 },
    { name: 'May', simcards: 280, shops: 30 },
    { name: 'Iyun', simcards: totalSimCards, shops: totalShops },
  ];

  // Real pie data based on shops distribution
  const pieData = Object.entries(shopsByRegion).map(([region, count], index) => {
    const colors = [
      'hsl(var(--primary))',
      'hsl(var(--primary-glow))',
      'hsl(var(--accent))',
      'hsl(var(--muted-foreground))'
    ];
    return {
      name: region,
      value: Math.round((count / totalShops) * 100),
      color: colors[index % colors.length]
    };
  });

  const statCards = [
    {
      title: 'Jami magazinlar',
      value: totalShops.toString(),
      change: `${activeShops} faol`,
      icon: Store,
      color: 'text-primary'
    },
    {
      title: 'Biriktirilgan simkartalar',
      value: assignedSimCards.toString(),
      change: `${availableSimCards} mavjud`,
      icon: CreditCard,
      color: 'text-accent'
    },
    {
      title: 'Simkartalar bazasi',
      value: totalSimCards.toString(),
      change: `${Math.round((assignedSimCards/totalSimCards)*100)}% ishlatilgan`,
      icon: TrendingUp,
      color: 'text-primary-glow'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Jizzax viloyati statistikasi</h1>
          <p className="text-muted-foreground">Magazinlar va simkartalar ma'lumotlari</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="shadow-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-primary font-medium">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-primary/10 ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-foreground">Simkartalar holati</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Biriktirilgan', value: assignedSimCards, color: 'hsl(var(--primary))' },
                    { name: 'Mavjud', value: availableSimCards, color: 'hsl(var(--primary-glow))' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value} ta`}
                >
                  {[
                    { name: 'Biriktirilgan', value: assignedSimCards, color: 'hsl(var(--primary))' },
                    { name: 'Mavjud', value: availableSimCards, color: 'hsl(var(--primary-glow))' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default Statistics;