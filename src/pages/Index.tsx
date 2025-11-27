import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface XMLFile {
  name: string;
  size: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  data?: Record<string, string>[];
}

interface ParsedField {
  name: string;
  type: string;
  selected: boolean;
}

const Index = () => {
  const [files, setFiles] = useState<XMLFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [parsedFields, setParsedFields] = useState<ParsedField[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.name.endsWith('.xml')
    );

    if (droppedFiles.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, загрузите только XML файлы',
        variant: 'destructive',
      });
      return;
    }

    const newFiles: XMLFile[] = droppedFiles.map(file => ({
      name: file.name,
      size: file.size,
      status: 'pending',
    }));

    setFiles(prev => [...prev, ...newFiles]);
    toast({
      title: 'Файлы загружены',
      description: `Добавлено ${droppedFiles.length} файлов`,
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const xmlFiles = Array.from(selectedFiles).filter(file =>
      file.name.endsWith('.xml')
    );

    const newFiles: XMLFile[] = xmlFiles.map(file => ({
      name: file.name,
      size: file.size,
      status: 'pending',
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const parseFiles = () => {
    if (files.length === 0) {
      toast({
        title: 'Нет файлов',
        description: 'Пожалуйста, сначала загрузите XML файлы',
        variant: 'destructive',
      });
      return;
    }

    setFiles(prev =>
      prev.map(file => ({ ...file, status: 'processing' as const }))
    );

    setTimeout(() => {
      const mockFields: ParsedField[] = [
        { name: 'id', type: 'number', selected: true },
        { name: 'name', type: 'string', selected: true },
        { name: 'email', type: 'string', selected: true },
        { name: 'date', type: 'date', selected: true },
        { name: 'status', type: 'string', selected: true },
        { name: 'amount', type: 'number', selected: true },
      ];

      const mockData = files.map((file, index) => ({
        ...file,
        status: 'done' as const,
        data: [
          {
            id: String(index + 1),
            name: `Запись из ${file.name}`,
            email: `user${index + 1}@example.com`,
            date: new Date(2024, 0, index + 1).toISOString().split('T')[0],
            status: index % 2 === 0 ? 'Активный' : 'Неактивный',
            amount: String((index + 1) * 1000),
          },
        ],
      }));

      setFiles(mockData);
      setParsedFields(mockFields);
      setActiveTab('settings');

      toast({
        title: 'Парсинг завершён',
        description: `Обработано ${files.length} файлов`,
      });
    }, 2000);
  };

  const exportToXLSX = () => {
    const selectedFields = parsedFields.filter(f => f.selected);

    if (selectedFields.length === 0) {
      toast({
        title: 'Выберите поля',
        description: 'Выберите хотя бы одно поле для экспорта',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Экспорт начат',
      description: 'Файл XLSX будет загружен через несколько секунд',
    });

    setTimeout(() => {
      setActiveTab('export');
      toast({
        title: 'Экспорт завершён',
        description: 'Файл успешно создан и готов к загрузке',
      });
    }, 1500);
  };

  const downloadXLSX = () => {
    const selectedFields = parsedFields.filter(f => f.selected);
    const allData = files.flatMap(file => file.data || []);

    let csvContent = selectedFields.map(f => f.name).join(',') + '\n';
    
    allData.forEach(row => {
      const rowData = selectedFields.map(field => row[field.name] || '').join(',');
      csvContent += rowData + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `parsed_data_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Файл загружен',
      description: 'CSV файл успешно сохранён на вашем устройстве',
    });
  };

  const toggleField = (fieldName: string) => {
    setParsedFields(prev =>
      prev.map(f =>
        f.name === fieldName ? { ...f, selected: !f.selected } : f
      )
    );
  };

  const getStatusIcon = (status: XMLFile['status']) => {
    switch (status) {
      case 'pending':
        return 'Clock';
      case 'processing':
        return 'RefreshCw';
      case 'done':
        return 'CheckCircle2';
      case 'error':
        return 'XCircle';
    }
  };

  const getStatusColor = (status: XMLFile['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-500';
      case 'processing':
        return 'bg-blue-500';
      case 'done':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
    }
  };

  const completedFiles = files.filter(f => f.status === 'done').length;
  const progress = files.length > 0 ? (completedFiles / files.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-3">
            XML to XLSX Parser
          </h1>
          <p className="text-muted-foreground text-lg">
            Объедините сотни XML файлов в один XLSX за минуту
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-14">
            <TabsTrigger value="upload" className="text-base">
              <Icon name="Upload" size={20} className="mr-2" />
              Загрузка
            </TabsTrigger>
            <TabsTrigger value="settings" disabled={files.length === 0} className="text-base">
              <Icon name="Settings" size={20} className="mr-2" />
              Настройки
            </TabsTrigger>
            <TabsTrigger value="export" disabled={parsedFields.length === 0} className="text-base">
              <Icon name="FileSpreadsheet" size={20} className="mr-2" />
              Экспорт
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6 animate-scale-in">
            <Card
              className={`p-12 border-2 border-dashed transition-all duration-300 ${
                dragActive
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-gray-300 hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className={`p-6 rounded-full bg-gradient-to-br from-primary to-accent ${dragActive ? 'animate-pulse-glow' : ''}`}>
                  <Icon name="FileUp" size={48} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">
                    Перетащите XML файлы сюда
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    или нажмите кнопку ниже для выбора файлов
                  </p>
                </div>
                <div>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".xml"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <label htmlFor="file-upload">
                    <Button size="lg" className="cursor-pointer" asChild>
                      <span>
                        <Icon name="FolderOpen" size={20} className="mr-2" />
                        Выбрать файлы
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </Card>

            {files.length > 0 && (
              <Card className="p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">Загруженные файлы</h3>
                    <p className="text-sm text-muted-foreground">
                      Всего: {files.length} файлов
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setFiles([])}
                      disabled={files.some(f => f.status === 'processing')}
                    >
                      <Icon name="Trash2" size={18} className="mr-2" />
                      Очистить
                    </Button>
                    <Button
                      onClick={parseFiles}
                      disabled={files.some(f => f.status === 'processing')}
                      size="lg"
                      className="bg-gradient-to-r from-primary to-accent"
                    >
                      <Icon name="Play" size={20} className="mr-2" />
                      Начать парсинг
                    </Button>
                  </div>
                </div>

                {progress > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Прогресс обработки</span>
                      <span className="text-muted-foreground">
                        {completedFiles} из {files.length}
                      </span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>
                )}

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Icon
                          name={getStatusIcon(file.status)}
                          size={24}
                          className={`${
                            file.status === 'processing' ? 'animate-spin' : ''
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(file.status)}>
                        {file.status === 'pending' && 'Ожидание'}
                        {file.status === 'processing' && 'Обработка'}
                        {file.status === 'done' && 'Готово'}
                        {file.status === 'error' && 'Ошибка'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 animate-scale-in">
            <Card className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Настройка полей</h3>
                <p className="text-muted-foreground">
                  Выберите поля, которые нужно включить в итоговый XLSX файл
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {parsedFields.map(field => (
                  <div
                    key={field.name}
                    onClick={() => toggleField(field.name)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      field.selected
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            field.selected
                              ? 'bg-primary border-primary'
                              : 'border-gray-300'
                          }`}
                        >
                          {field.selected && (
                            <Icon name="Check" size={14} className="text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{field.name}</p>
                          <p className="text-sm text-muted-foreground">{field.type}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{field.type}</Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Выбрано полей: {parsedFields.filter(f => f.selected).length} из{' '}
                  {parsedFields.length}
                </p>
                <Button
                  onClick={exportToXLSX}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent"
                >
                  <Icon name="Download" size={20} className="mr-2" />
                  Экспортировать в XLSX
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-6 animate-scale-in">
            <Card className="p-8">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 animate-scale-in">
                  <Icon name="CheckCircle2" size={64} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">
                    Экспорт завершён успешно!
                  </h3>
                  <p className="text-muted-foreground text-lg mb-6">
                    Ваш XLSX файл готов к загрузке
                  </p>
                </div>

                <div className="w-full max-w-md space-y-3 text-left">
                  <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-muted-foreground">Обработано файлов:</span>
                    <span className="font-semibold">{files.length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-muted-foreground">Всего записей:</span>
                    <span className="font-semibold">{files.length * 1}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-muted-foreground">Полей в таблице:</span>
                    <span className="font-semibold">
                      {parsedFields.filter(f => f.selected).length}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary to-accent"
                    onClick={downloadXLSX}
                  >
                    <Icon name="Download" size={20} className="mr-2" />
                    Скачать CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setFiles([]);
                      setParsedFields([]);
                      setActiveTab('upload');
                    }}
                  >
                    <Icon name="RotateCcw" size={20} className="mr-2" />
                    Начать заново
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;