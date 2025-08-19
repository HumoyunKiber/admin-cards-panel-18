import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimCardStatus {
  simCardCode: string;
  status: string;
  isSold: boolean;
  saleDate: string | null;
  message: string;
}

const SimCardChecker: React.FC = () => {
  const [simCardCode, setSimCardCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<SimCardStatus | null>(null);
  const { toast } = useToast();

  const checkSimCardStatus = async () => {
    if (!simCardCode.trim()) {
      toast({
        title: "Xato!",
        description: "Simkarta kodini kiriting",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    setResult(null);

    try {
      const response = await fetch('/functions/v1/check-simcard-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ simCardCode: simCardCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Xatolik yuz berdi');
      }

      setResult(data);
      
      toast({
        title: "Muvaffaqiyat!",
        description: "Simkarta holati tekshirildi",
      });

    } catch (error) {
      console.error('Simkarta tekshirishda xatolik:', error);
      toast({
        title: "Xato!",
        description: error instanceof Error ? error.message : "Simkarta tekshirishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkSimCardStatus();
    }
  };

  const getStatusIcon = (isSold: boolean) => {
    if (isSold) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = (isSold: boolean) => {
    if (isSold) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Sotilgan</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800 border-red-200">Sotilmagan</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Simkarta holatini tekshirish
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="simcode">Simkarta kodi</Label>
              <Input
                id="simcode"
                placeholder="Simkarta kodini kiriting..."
                value={simCardCode}
                onChange={(e) => setSimCardCode(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isChecking}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={checkSimCardStatus}
                disabled={isChecking || !simCardCode.trim()}
                className="bg-primary hover:bg-primary-glow"
              >
                {isChecking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {isChecking ? 'Tekshirilmoqda...' : 'Tekshirish'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Tekshirish natijasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Simkarta kodi</Label>
                <p className="text-sm bg-accent/20 p-2 rounded border font-mono">
                  {result.simCardCode}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Holat</Label>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.isSold)}
                  {getStatusBadge(result.isSold)}
                </div>
              </div>
              
              {result.saleDate && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sotilgan sana</Label>
                  <p className="text-sm bg-accent/20 p-2 rounded border">
                    {new Date(result.saleDate).toLocaleDateString('uz-UZ')}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Xabar</Label>
                <p className="text-sm bg-accent/20 p-2 rounded border">
                  {result.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SimCardChecker;