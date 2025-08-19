import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  RefreshCw 
} from 'lucide-react';
import { useSimCard } from '@/contexts/SimCardContext';

const AutoCheckPanel: React.FC = () => {
  const { 
    lastAutoCheck, 
    autoCheckStatus,
    simCards
  } = useSimCard();

  const getStatusIcon = () => {
    switch (autoCheckStatus) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusText = () => {
    switch (autoCheckStatus) {
      case 'checking':
        return 'Tekshirilmoqda...';
      case 'error':
        return 'Xatolik yuz berdi';
      default:
        return 'Faol';
    }
  };

  const soldSimCards = simCards.filter(s => s.status === 'sold').length;
  const availableSimCards = simCards.filter(s => s.status === 'available').length;

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Avtomatik tekshirish tizimi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Panel */}
        <div className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <span className="text-lg font-medium text-green-700 dark:text-green-300">
              Avtomatik tekshirish: {getStatusText()}
            </span>
          </div>
        </div>

        {/* Status Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{availableSimCards}</div>
            <div className="text-sm text-green-700 dark:text-green-300">Mavjud</div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{soldSimCards}</div>
            <div className="text-sm text-red-700 dark:text-red-300">Sotilgan</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{simCards.length}</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Jami</div>
          </div>
        </div>

        {/* Last Check Info */}
        {lastAutoCheck && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Oxirgi tekshiruv: {new Date(lastAutoCheck).toLocaleString('uz-UZ')}
            </span>
          </div>
        )}

        {/* Auto Check Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Simkartalar har 5 daqiqada avtomatik tekshirilmoqda. 
            API orqali yangi sotuvlar haqida darhol xabar beriladi.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoCheckPanel;