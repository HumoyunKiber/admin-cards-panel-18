import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, Smartphone, CheckCircle, Upload, FileJson } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSimCard } from '@/contexts/SimCardContext';
import SimCardChecker from '@/components/admin/SimCardChecker';
import AutoCheckPanel from '@/components/admin/AutoCheckPanel';


const SimCards = () => {
  const { toast } = useToast();
  const { simCards, createSimCard, deleteSimCard, isLoading } = useSimCard();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: ''
  });
  const [bulkCodes, setBulkCodes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kodni tekshirish
    if (formData.code.length !== 19 || !/^\d+$/.test(formData.code)) {
      toast({
        title: "Xato!",
        description: "Simkarta kodi 19 ta raqamdan iborat bo'lishi kerak",
        variant: "destructive",
      });
      return;
    }
    
    const simCardData = {
      code: formData.code,
      status: 'available' as const,
      addedDate: new Date().toISOString().split('T')[0]
    };

    const success = await createSimCard(simCardData);
    if (success) {
      setFormData({ code: '' });
      setShowForm(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const codes = bulkCodes
      .split('\n')
      .map(code => code.trim())
      .filter(code => code.length === 19 && /^\d+$/.test(code));
    
    if (codes.length === 0) {
      toast({
        title: "Xato!",
        description: "Hech qanday to'g'ri simkarta kodi topilmadi",
        variant: "destructive",
      });
      return;
    }

    // Har bir kodni API orqali qo'shish
    let successCount = 0;
    for (const code of codes) {
      const simCardData = {
        code,
        status: 'available' as const,
        addedDate: new Date().toISOString().split('T')[0]
      };
      
      const success = await createSimCard(simCardData);
      if (success) {
        successCount++;
      }
    }

    setBulkCodes('');
    
    toast({
      title: "Muvaffaqiyat!",
      description: `${successCount} ta simkarta muvaffaqiyatli qo'shildi`,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        // JSON fayl bo'lsa
        if (file.type === 'application/json') {
          const data = JSON.parse(content);
          let codes: string[] = [];
          
          if (Array.isArray(data)) {
            codes = data.filter(item => 
              typeof item === 'string' && item.length === 19 && /^\d+$/.test(item)
            );
          } else if (data.codes && Array.isArray(data.codes)) {
            codes = data.codes.filter((item: any) => 
              typeof item === 'string' && item.length === 19 && /^\d+$/.test(item)
            );
          }
          
          setBulkCodes(codes.join('\n'));
        } else {
          // Oddiy matn fayl
          setBulkCodes(content);
        }
        
        toast({
          title: "Fayl yuklandi!",
          description: "Simkarta kodlari muvaffaqiyatli yuklandi",
        });
      } catch (error) {
        toast({
          title: "Xato!",
          description: "Faylni o'qishda xatolik yuz berdi",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
    // Input ni tozalash
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteSimCard(id);
    // Context o'z-o'zidan yangilanadi, qo'shimcha harakat shart emas
  };

  const filteredSimCards = simCards.filter(card =>
    card.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (card.assignedShopName && card.assignedShopName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    const variants = {
      available: 'bg-green-100 text-green-800',
      assigned: 'bg-blue-100 text-blue-800',
      sold: 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      available: 'Mavjud',
      assigned: 'Biriktirilgan',
      sold: 'Sotilgan'
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Simkarta bazasi</h1>
        <p className="text-muted-foreground">Simkarta kodlarini kiritib bazaga qo'shing va holatini tekshiring</p>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Simkartalar ro'yxati
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Simkarta qo'shish
          </TabsTrigger>
          <TabsTrigger value="check" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Holat tekshirish
          </TabsTrigger>
          <TabsTrigger value="auto" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Avtomatik tekshirish
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">

          {/* Search and Table */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">Simkarta bazasi</CardTitle>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Simkarta kodi bo'yicha qidiruv..."
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
                    <TableHead>Simkarta kodi</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Biriktirilgan magazin</TableHead>
                    <TableHead>Qo'shilgan sana</TableHead>
                    <TableHead className="w-[100px]">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSimCards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-medium font-mono">{card.code}</TableCell>
                      <TableCell>{getStatusBadge(card.status)}</TableCell>
                      <TableCell>
                        {card.assignedShopName ? (
                          <span className="text-primary">{card.assignedShopName}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{card.addedDate}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(card.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Empty State */}
          {filteredSimCards.length === 0 && (
            <Card className="shadow-card border-0">
              <CardContent className="p-12 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <p className="text-muted-foreground">
                  Hech qanday simkarta topilmadi
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          {/* Bitta simkarta qo'shish */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-foreground">Bitta simkarta qo'shish</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Simkarta kodi</Label>
                  <Input
                    id="code"
                    placeholder="8999899003689066861"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    pattern="[0-9]{19}"
                    maxLength={19}
                  />
                  <p className="text-sm text-muted-foreground">19 raqamli simkarta kodini kiriting</p>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-primary hover:bg-primary-glow">
                    Qo'shish
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Ko'p simkarta qo'shish */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Ko'p simkarta qo'shish
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Bir nechta simkarta kodini birdan qo'shing
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fayl yuklash */}
              <div className="space-y-2">
                <Label>Fayl yuklash</Label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <FileJson className="h-4 w-4" />
                    JSON/TXT fayl yuklash
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  JSON format: ["8999899003689066861", "8999899003689066862"] yoki {`{"codes": ["8999899003689066861"]}`}
                </p>
              </div>

              {/* Manual kiritish */}
              <form onSubmit={handleBulkSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulkCodes">Simkarta kodlari (har bir satrda bitta)</Label>
                  <Textarea
                    id="bulkCodes"
                    placeholder="8999899003689066861&#10;8999899003689066862&#10;8999899003689066863"
                    value={bulkCodes}
                    onChange={(e) => setBulkCodes(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground">
                    Har bir satrga bitta 19 raqamli simkarta kodini kiriting
                  </p>
                </div>
                
                {bulkCodes && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Kiriting: {bulkCodes.split('\n').filter(code => code.trim()).length} ta kod
                    </p>
                    <p className="text-sm text-green-600">
                      To'g'ri: {bulkCodes.split('\n').filter(code => code.trim().length === 19 && /^\d+$/.test(code.trim())).length} ta
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary-glow"
                    disabled={!bulkCodes.trim()}
                  >
                    Ko'p simkarta qo'shish
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setBulkCodes('')}
                  >
                    Tozalash
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="check" className="space-y-4">
          <SimCardChecker />
        </TabsContent>

        <TabsContent value="auto" className="space-y-4">
          <AutoCheckPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SimCards;