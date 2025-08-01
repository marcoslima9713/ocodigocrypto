import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Upload, Play, Eye, Save, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';

interface Module {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
  cover_image?: string;
}

interface VideoLesson {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  thumbnail_path: string | null;
  module_id: string | null;
  order_index: number | null;
  duration: number | null;
  file_size: number | null;
  is_public: boolean | null;
  difficulty_level: string | null;
  status: string | null;
  estimated_minutes: number | null;
  created_at: string;
  updated_at: string;
}

interface ModuleCover {
  id: string;
  module_id: string;
  cover_image: string;
  created_at: string;
  updated_at: string;
}

const VideoManager: React.FC = () => {
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleCovers, setModuleCovers] = useState<ModuleCover[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingVideo, setEditingVideo] = useState<VideoLesson | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showCoverDialog, setShowCoverDialog] = useState(false);
  const [editingCover, setEditingCover] = useState<{moduleId: string, imageUrl: string} | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const { toast } = useToast();

  // Carregar dados
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Carregar módulos
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .order('order_index');

      if (modulesError) throw modulesError;
      setModules(modulesData || []);

      // Carregar vídeos
      const { data: videosData, error: videosError } = await supabase
        .from('video_lessons')
        .select('*')
        .order('module_id, order_index');

      if (videosError) throw videosError;
      setVideos(videosData || []);

      // Carregar capas dos módulos
      try {
        const { data: coversData, error: coversError } = await supabase
          .from('module_covers')
          .select('*');
        
        if (!coversError && coversData) {
          setModuleCovers(coversData);
        }
      } catch (error) {
        console.log('Tabela module_covers não existe ainda ou erro ao buscar capas');
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos vídeos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar vídeos
  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = filterModule === 'all' || video.module_id === filterModule;
    const matchesStatus = filterStatus === 'all' || video.status === filterStatus;
    
    return matchesSearch && matchesModule && matchesStatus;
  });

  // Funções para gerenciar capas dos módulos
  const getModuleCover = (moduleId: string) => {
    const cover = moduleCovers.find(c => c.module_id === moduleId);
    return cover?.cover_image || '';
  };

  const saveModuleCover = async (moduleId: string, imageUrl: string) => {
    try {
      // Verificar se já existe uma capa para este módulo
      const existingCover = moduleCovers.find(c => c.module_id === moduleId);
      
      if (existingCover) {
        // Atualizar capa existente
        const { error } = await supabase
          .from('module_covers')
          .update({ 
            cover_image: imageUrl,
            updated_at: new Date().toISOString()
          })
          .eq('module_id', moduleId);
        
        if (error) throw error;
      } else {
        // Criar nova capa
        const { error } = await supabase
          .from('module_covers')
          .insert({
            module_id: moduleId,
            cover_image: imageUrl
          });
        
        if (error) throw error;
      }
      
      toast({
        title: "Sucesso",
        description: "Capa do módulo salva com sucesso",
      });
      
      fetchData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao salvar capa:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar capa do módulo",
        variant: "destructive",
      });
    }
  };

  const deleteModuleCover = async (moduleId: string) => {
    if (!confirm('Tem certeza que deseja remover a capa deste módulo?')) return;

    try {
      const { error } = await supabase
        .from('module_covers')
        .delete()
        .eq('module_id', moduleId);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Capa do módulo removida com sucesso",
      });
      
      fetchData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao deletar capa:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover capa do módulo",
        variant: "destructive",
      });
    }
  };

  const handleCoverImageUrlChange = (url: string) => {
    setCoverImageUrl(url);
    setCoverImagePreview(url);
  };

  const handleSaveCover = async () => {
    if (!editingCover || !coverImageUrl.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um link de imagem válido",
        variant: "destructive",
      });
      return;
    }

    await saveModuleCover(editingCover.moduleId, coverImageUrl.trim());
    setShowCoverDialog(false);
    setEditingCover(null);
    setCoverImageUrl('');
    setCoverImagePreview('');
  };

  // Salvar vídeo
  const saveVideo = async (videoData: Partial<VideoLesson>) => {
    try {
      if (editingVideo) {
        // Atualizar vídeo existente
        const updateData = {
          title: videoData.title,
          description: videoData.description,
          file_path: videoData.file_path,
          thumbnail_path: videoData.thumbnail_path,
          module_id: videoData.module_id,
          order_index: videoData.order_index,
          difficulty_level: videoData.difficulty_level,
          status: videoData.status,
          estimated_minutes: videoData.estimated_minutes,
          is_public: videoData.status === 'publicado',
          updated_at: new Date().toISOString()
        };

        console.log('🔄 Atualizando vídeo:', editingVideo.id, updateData);

        const { data, error } = await supabase
          .from('video_lessons')
          .update(updateData)
          .eq('id', editingVideo.id)
          .select();

        if (error) {
          console.error('❌ Erro ao atualizar vídeo:', error);
          throw error;
        }
        
        console.log('✅ Vídeo atualizado com sucesso:', data);
        
        toast({
          title: "Sucesso",
          description: "Vídeo atualizado com sucesso",
        });
      } else {
        // Criar novo vídeo
        const insertData = {
          title: videoData.title,
          description: videoData.description,
          file_path: videoData.file_path,
          thumbnail_path: videoData.thumbnail_path,
          module_id: videoData.module_id,
          order_index: videoData.order_index || 0,
          difficulty_level: videoData.difficulty_level,
          status: videoData.status || 'rascunho',
          estimated_minutes: videoData.estimated_minutes || 0,
          is_public: (videoData.status || 'rascunho') === 'publicado'
        };

        console.log('➕ Criando novo vídeo:', insertData);

        const { data, error } = await supabase
          .from('video_lessons')
          .insert(insertData)
          .select();

        if (error) {
          console.error('❌ Erro ao criar vídeo:', error);
          throw error;
        }
        
        console.log('✅ Vídeo criado com sucesso:', data);
        
        toast({
          title: "Sucesso",
          description: "Vídeo criado com sucesso",
        });
      }

      setShowVideoDialog(false);
      setEditingVideo(null);
      
      // Forçar recarregamento dos dados
      await fetchData();
      
    } catch (error) {
      console.error('❌ Erro ao salvar vídeo:', error);
      toast({
        title: "Erro",
        description: `Erro ao salvar vídeo: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Salvar módulo
  const saveModule = async (moduleData: Partial<Module>) => {
    try {
      if (editingModule) {
        // Atualizar módulo existente
        const { error } = await supabase
          .from('modules')
          .update({
            name: moduleData.name,
            description: moduleData.description,
            order_index: moduleData.order_index,
            is_active: moduleData.is_active
          })
          .eq('id', editingModule.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Módulo atualizado com sucesso",
        });
      } else {
        // Criar novo módulo
        const moduleId = moduleData.name?.toLowerCase().replace(/\s+/g, '-') || '';
        const { error } = await supabase
          .from('modules')
          .insert({
            id: moduleId,
            name: moduleData.name,
            description: moduleData.description,
            order_index: moduleData.order_index || 0,
            is_active: moduleData.is_active !== false
          });

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Módulo criado com sucesso",
        });
      }

      setShowModuleDialog(false);
      setEditingModule(null);
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar módulo:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar módulo",
        variant: "destructive",
      });
    }
  };

  // Deletar vídeo
  const deleteVideo = async (videoId: string) => {
    if (!confirm('Tem certeza que deseja deletar este vídeo?')) return;

    try {
      const { error } = await supabase
        .from('video_lessons')
        .delete()
        .eq('id', videoId);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Vídeo deletado com sucesso",
      });
      
      fetchData();
    } catch (error) {
      console.error('Erro ao deletar vídeo:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar vídeo",
        variant: "destructive",
      });
    }
  };

  // Deletar módulo
  const deleteModule = async (moduleId: string) => {
    if (!confirm('Tem certeza que deseja deletar este módulo? Todos os vídeos do módulo também serão afetados.')) return;

    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Módulo deletado com sucesso",
      });
      
      fetchData();
    } catch (error) {
      console.error('Erro ao deletar módulo:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar módulo",
        variant: "destructive",
      });
    }
  };

  const getModuleName = (moduleId: string | null) => {
    if (!moduleId) return 'Sem módulo';
    const module = modules.find(m => m.id === moduleId);
    return module?.name || moduleId;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gerenciador de Vídeos</h1>
        <div className="flex gap-2">
          <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingModule(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Módulo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingModule ? 'Editar Módulo' : 'Novo Módulo'}
                </DialogTitle>
              </DialogHeader>
              <ModuleForm
                module={editingModule}
                onSave={saveModule}
                onCancel={() => setShowModuleDialog(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingVideo(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Vídeo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingVideo ? 'Editar Vídeo' : 'Novo Vídeo'}
                </DialogTitle>
              </DialogHeader>
              <VideoForm
                video={editingVideo}
                modules={modules}
                onSave={saveVideo}
                onCancel={() => setShowVideoDialog(false)}
              />
            </DialogContent>
          </Dialog>

          {/* Diálogo para editar capa do módulo */}
          <Dialog open={showCoverDialog} onOpenChange={setShowCoverDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingCover ? `Editar Capa do Módulo: ${modules.find(m => m.id === editingCover.moduleId)?.name}` : 'Editar Capa do Módulo'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="coverImageUrl">Link da Imagem</Label>
                  <Input
                    id="coverImageUrl"
                    placeholder="Cole aqui o link da imagem (ex: blob:https://imgur.com/...)"
                    value={coverImageUrl}
                    onChange={(e) => handleCoverImageUrlChange(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Cole aqui o link da imagem. Pode ser um link blob do Imgur ou qualquer URL de imagem válida.
                  </p>
                </div>

                {coverImagePreview && (
                  <div>
                    <Label>Preview da Imagem</Label>
                    <div className="mt-2 border rounded-md p-4">
                      <img
                        src={coverImagePreview}
                        alt="Preview da capa"
                        className="w-full h-48 object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden text-center text-muted-foreground py-8">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                        <p>Imagem não carregada</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowCoverDialog(false);
                    setEditingCover(null);
                    setCoverImageUrl('');
                    setCoverImagePreview('');
                  }}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleSaveCover}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Capa
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterModule} onValueChange={setFilterModule}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os módulos</SelectItem>
                {modules.map(module => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="publicado">Publicado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de vídeos */}
      <Card>
        <CardHeader>
          <CardTitle>
            Vídeos ({filteredVideos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredVideos.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhum vídeo encontrado com os filtros aplicados.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dificuldade</TableHead>
                  <TableHead>Tempo Est.</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVideos.map(video => (
                  <TableRow key={video.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{video.title}</div>
                        {video.description && (
                          <div className="text-sm text-muted-foreground">
                            {video.description.length > 60 
                              ? `${video.description.substring(0, 60)}...`
                              : video.description
                            }
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getModuleName(video.module_id)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={video.status === 'publicado' ? 'default' : 'secondary'}>
                        {video.status || 'rascunho'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {video.difficulty_level ? (
                        <Badge variant="outline">
                          {video.difficulty_level}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {video.estimated_minutes ? `${video.estimated_minutes}min` : '-'}
                    </TableCell>
                    <TableCell>{video.order_index || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingVideo(video);
                            setShowVideoDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteVideo(video.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {video.file_path && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://wvojbjkdlnvlqgjwtdaf.supabase.co/storage/v1/object/public/video-lessons/${video.file_path}`, '_blank')}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Lista de módulos */}
      <Card>
        <CardHeader>
          <CardTitle>Módulos ({modules.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map(module => (
              <Card key={module.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{module.name}</h3>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingModule(module);
                          setShowModuleDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteModule(module.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {module.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {module.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <Badge variant={module.is_active ? 'default' : 'secondary'}>
                      {module.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <span className="text-muted-foreground">
                      Ordem: {module.order_index}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {videos.filter(v => v.module_id === module.id).length} vídeos
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gerenciamento de Capas dos Módulos */}
      <Card>
        <CardHeader>
          <CardTitle>Capas dos Módulos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map(module => {
              const coverImage = getModuleCover(module.id);
              return (
                <Card key={module.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold">{module.name}</h3>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCover({ moduleId: module.id, imageUrl: coverImage });
                            setCoverImageUrl(coverImage);
                            setCoverImagePreview(coverImage);
                            setShowCoverDialog(true);
                          }}
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                        {coverImage && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteModuleCover(module.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {coverImage ? (
                      <div className="relative">
                        <img
                          src={coverImage}
                          alt={`Capa do módulo ${module.name}`}
                          className="w-full h-32 object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-md flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Sem capa</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      {coverImage ? 'Capa personalizada' : 'Capa padrão'}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente do formulário de vídeo
interface VideoFormProps {
  video: VideoLesson | null;
  modules: Module[];
  onSave: (video: Partial<VideoLesson>) => void;
  onCancel: () => void;
}

const VideoForm: React.FC<VideoFormProps> = ({ video, modules, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: video?.title || '',
    description: video?.description || '',
    file_path: video?.file_path || '',
    thumbnail_path: video?.thumbnail_path || '',
    module_id: video?.module_id || '',
    order_index: video?.order_index || 0,
    difficulty_level: video?.difficulty_level || '',
    status: video?.status || 'rascunho',
    estimated_minutes: video?.estimated_minutes || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-sm font-medium">Título</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium">Descrição</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium">Caminho do Arquivo</label>
          <Input
            value={formData.file_path}
            onChange={(e) => setFormData({ ...formData, file_path: e.target.value })}
            placeholder="ex: origens do bitcoin/video1.mp4"
            required
          />
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium">Caminho da Thumbnail</label>
          <Input
            value={formData.thumbnail_path}
            onChange={(e) => setFormData({ ...formData, thumbnail_path: e.target.value })}
            placeholder="ex: thumbnails/video1.jpg"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Módulo</label>
          <Select value={formData.module_id} onValueChange={(value) => setFormData({ ...formData, module_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um módulo" />
            </SelectTrigger>
            <SelectContent>
              {modules.map(module => (
                <SelectItem key={module.id} value={module.id}>
                  {module.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Ordem</label>
          <Input
            type="number"
            value={formData.order_index}
            onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Dificuldade</label>
          <Select value={formData.difficulty_level} onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a dificuldade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="iniciante">Iniciante</SelectItem>
              <SelectItem value="intermediario">Intermediário</SelectItem>
              <SelectItem value="avancado">Avançado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Status</label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="publicado">Publicado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Tempo Estimado (minutos)</label>
          <Input
            type="number"
            value={formData.estimated_minutes}
            onChange={(e) => setFormData({ ...formData, estimated_minutes: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Salvar
        </Button>
      </div>
    </form>
  );
};

// Componente do formulário de módulo
interface ModuleFormProps {
  module: Module | null;
  onSave: (module: Partial<Module>) => void;
  onCancel: () => void;
}

const ModuleForm: React.FC<ModuleFormProps> = ({ module, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: module?.name || '',
    description: module?.description || '',
    order_index: module?.order_index || 0,
    is_active: module?.is_active !== false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nome do Módulo</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">Descrição</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Ordem</label>
        <Input
          type="number"
          value={formData.order_index}
          onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="rounded border-gray-300"
        />
        <label htmlFor="is_active" className="text-sm font-medium">
          Módulo ativo
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Salvar
        </Button>
      </div>
    </form>
  );
};

export default VideoManager;