
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import type { ShortVideo, College, Specialty } from '../types';
import { supabase } from '../lib/supabaseClient';
import EditDataModal, { EditField } from './EditDataModal';

interface ShortsScreenProps {
    onBack: () => void;
    onNavigateToAuth: () => void;
    onNavigateToCollege: (id: string) => void;
    onNavigateToSpecialty: (id: string) => void;
    onLike?: () => void; // Optional callback for achievements
    isAdminMode?: boolean;
}

const ShortsScreen: React.FC<ShortsScreenProps> = ({ onBack, onNavigateToAuth, onNavigateToCollege, onNavigateToSpecialty, onLike, isAdminMode }) => {
  const [videos, setVideos] = useState<ShortVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Data for Selects & Enrichment
  const [allColleges, setAllColleges] = useState<College[]>([]);
  const [allSpecialties, setAllSpecialties] = useState<Specialty[]>([]);

  // Interaction State
  const [likedVideos, setLikedVideos] = useState<{[key: string]: boolean}>({});
  const [likeCounts, setLikeCounts] = useState<{[key: string]: number}>({});
  
  // Two-step deletion state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const fetchData = async () => {
      setLoading(true);
      try {
          const [vids, cols, specs] = await Promise.all([
              api.getShorts(),
              api.getColleges(),
              api.getSpecialties()
          ]);
          
          setAllColleges(cols);
          setAllSpecialties(specs);

          // Enrich videos with names immediately
          const enrichedVideos = vids.map(v => {
              const col = cols.find(c => c.id === v.collegeId);
              const spec = specs.find(s => s.id === v.specialtyId);
              return {
                  ...v,
                  collegeName: col ? col.name : v.collegeName,
                  specialtyTitle: spec ? spec.title : v.specialtyTitle
              };
          });

          setVideos(enrichedVideos);
          
          // Initialize counts
          const initialCounts: any = {};
          vids.forEach(v => initialCounts[v.id] = v.likes);
          setLikeCounts(initialCounts);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      // Get Session
      const getSession = async () => {
          if (supabase) {
              const { data: { session } } = await supabase.auth.getSession();
              setCurrentUser(session?.user || null);
          }
      };
      getSession();
      fetchData();
  }, []);

  // Load Real Like Status when videos or user changes
  useEffect(() => {
      if (videos.length > 0 && currentUser) {
          videos.forEach(async (video) => {
              const { liked, count } = await api.getLikeStatus(video.id, currentUser.id);
              setLikedVideos(prev => ({...prev, [video.id]: liked}));
              setLikeCounts(prev => ({...prev, [video.id]: count > 0 ? count : video.likes}));
          });
      }
  }, [videos, currentUser]);

  useEffect(() => {
    if (loading || videos.length === 0) return;

    const observerOptions = {
      root: containerRef.current,
      threshold: 0.6,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const videoElement = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          const playPromise = videoElement.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              // Autoplay prevented
            });
          }
        } else {
          videoElement.pause();
          videoElement.currentTime = 0;
        }
      });
    }, observerOptions);

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => {
      observer.disconnect();
    };
  }, [loading, videos]);


  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isMuted) {
        const globalSound = localStorage.getItem('app_sound_enabled');
        if (globalSound === 'false') {
            const confirmEnable = window.confirm('Звук отключен в настройках приложения. Включить для этого видео?');
            if (!confirmEnable) return;
        }
    }
    setIsMuted(!isMuted);
  };

  const handleVideoClick = (e: React.MouseEvent, index: number) => {
      const video = videoRefs.current[index];
      if (video) {
          if (video.paused) {
              video.play();
          } else {
              video.pause();
          }
      }
  };

  const handleLike = async (videoId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!currentUser) {
          onNavigateToAuth();
          return;
      }

      const isLiked = likedVideos[videoId];
      setLikedVideos(prev => ({...prev, [videoId]: !isLiked}));
      setLikeCounts(prev => ({
          ...prev, 
          [videoId]: isLiked ? prev[videoId] - 1 : prev[videoId] + 1
      }));

      if (!isLiked && onLike) {
          onLike();
      }

      await api.toggleLike(videoId, currentUser.id);
  };

  const handleCreate = async (newData: any, setStatus?: (msg: string) => void) => {
      if (!newData.imageUrl) {
          throw new Error('Ошибка: Обложка обязательна.');
      }
      if (!newData.videoUrl) {
          throw new Error('Ошибка: Видео файл или ссылка обязательны.');
      }

      const res = await api.createShort(newData, setStatus);
      
      if (!res.success) {
          throw new Error(res.error || 'Неизвестная ошибка');
      } else if (res.data) {
          const enrichedVideo = { ...res.data };
          
          // Manually lookup names immediately
          if (enrichedVideo.collegeId) {
              const col = allColleges.find(c => c.id === enrichedVideo.collegeId);
              if (col) enrichedVideo.collegeName = col.name;
          }
          if (enrichedVideo.specialtyId) {
              const spec = allSpecialties.find(s => s.id === enrichedVideo.specialtyId);
              if (spec) enrichedVideo.specialtyTitle = spec.title;
          }

          setVideos(prev => [enrichedVideo, ...prev]);
          setIsCreateModalOpen(false);
      }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (deleteConfirmId === id) {
          performDelete(id);
      } else {
          setDeleteConfirmId(id);
          setTimeout(() => setDeleteConfirmId(null), 3000);
      }
  };

  const performDelete = async (id: string) => {
      setDeleteConfirmId(null);
      const res = await api.deleteShort(id);
      if (res.success) {
          setVideos(prev => prev.filter(v => v.id !== id));
      } else {
          console.error("Delete failed:", res.error);
          alert('Не удалось удалить: ' + res.error);
      }
  };

  const createFields: EditField[] = [
      { key: 'title', label: 'Название видео', type: 'text' },
      { key: 'description', label: 'Описание', type: 'textarea' },
      { key: 'author', label: 'Автор', type: 'text' },
      { key: 'imageUrl', label: 'Обложка (Превью)', type: 'image' },
      { key: 'videoUrl', label: 'Видео файл или ссылка (mp4)', type: 'file' },
      { 
          key: 'collegeId', 
          label: 'Связанный Колледж', 
          type: 'multiselect',
          options: allColleges.map(c => ({ value: c.id, label: c.name }))
      },
      { 
          key: 'specialtyId', 
          label: 'Связанная Специальность', 
          type: 'multiselect',
          options: allSpecialties.map(s => ({ value: s.id, label: s.title }))
      },
  ];

  return (
    <div className="fixed inset-0 bg-black z-50">
        {isAdminMode && (
            <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="fixed top-20 right-4 z-[60] bg-green-600 text-white p-3 rounded-full shadow-2xl hover:bg-green-700 transition-transform hover:scale-110 active:scale-95 border-2 border-white/20"
                title="Добавить видео"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>
        )}

        {isCreateModalOpen && (
            <EditDataModal 
                title="Добавить Shorts"
                initialData={{ author: 'Admin' }}
                fields={createFields}
                onSave={handleCreate}
                onClose={() => setIsCreateModalOpen(false)}
            />
        )}

        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <button onClick={onBack} className="text-white p-2 rounded-full bg-white/10 backdrop-blur-md pointer-events-auto hover:bg-white/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <h2 className="text-white font-bold text-lg drop-shadow-md pt-1">Shorts</h2>
            <div className="w-10"></div>
        </div>

        <div 
            ref={containerRef}
            className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        >
            {loading ? (
                <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
            ) : videos.length > 0 ? (
                videos.map((video, index) => (
                    <div key={video.id} className="h-full w-full snap-start relative bg-slate-900">
                        <video
                            ref={(el) => (videoRefs.current[index] = el)}
                            src={video.videoUrl}
                            poster={video.imageUrl}
                            className="h-full w-full object-cover"
                            loop
                            muted={isMuted}
                            playsInline
                            onClick={(e) => handleVideoClick(e, index)}
                        />
                        
                        {/* Right Sidebar - Actions */}
                        <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-30">
                             {/* Like */}
                             <button onClick={(e) => handleLike(video.id, e)} className="flex flex-col items-center gap-1 group">
                                <div className={`p-3 rounded-full backdrop-blur-md transition-all ${likedVideos[video.id] ? 'bg-rose-500/80 text-white' : 'bg-black/30 text-white group-hover:bg-black/50'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-7 w-7 ${likedVideos[video.id] ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <span className="text-white text-xs font-bold drop-shadow-md">{likeCounts[video.id] || 0}</span>
                            </button>

                            {/* Mute Toggle */}
                            <button onClick={(e) => toggleMute(e)} className="flex flex-col items-center gap-1">
                                <div className="p-3 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50 transition-colors">
                                    {isMuted ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        </svg>
                                    )}
                                </div>
                            </button>

                            {/* Admin Delete */}
                            {isAdminMode && (
                                <button 
                                    onClick={(e) => handleDeleteClick(e, video.id)}
                                    className={`flex flex-col items-center gap-1 transition-transform ${deleteConfirmId === video.id ? 'scale-110' : ''}`}
                                >
                                    <div className={`p-3 rounded-full backdrop-blur-md text-white transition-colors ${deleteConfirmId === video.id ? 'bg-red-600' : 'bg-black/30 hover:bg-red-500/50'}`}>
                                        {deleteConfirmId === video.id ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* Bottom Overlay - Info */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent pt-20 pb-20 px-6 pointer-events-none">
                            <div className="pointer-events-auto pr-16">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-xs font-bold text-white border border-white/30">
                                        {video.author[0]}
                                    </div>
                                    <span className="text-white font-bold text-sm drop-shadow-md">{video.author}</span>
                                </div>
                                <h3 className="text-white text-xl font-bold mb-2 leading-tight drop-shadow-lg">{video.title}</h3>
                                <p className="text-slate-200 text-sm line-clamp-2 drop-shadow-md mb-3">{video.description}</p>
                                
                                <div className="flex flex-wrap gap-2">
                                    {video.collegeName && (
                                        <button 
                                            onClick={() => video.collegeId && onNavigateToCollege(video.collegeId)}
                                            className="bg-sky-500/80 hover:bg-sky-500 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md transition-colors border border-white/20"
                                        >
                                            🎓 {video.collegeName}
                                        </button>
                                    )}
                                    {video.specialtyTitle && (
                                        <button 
                                            onClick={() => video.specialtyId && onNavigateToSpecialty(video.specialtyId)}
                                            className="bg-purple-500/80 hover:bg-purple-500 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md transition-colors border border-white/20"
                                        >
                                            💼 {video.specialtyTitle}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-white px-6 text-center">
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Здесь пока пусто</h3>
                    <p className="text-white/60 mb-8">Видео скоро появятся. Если вы администратор, добавьте первое видео!</p>
                    {isAdminMode && (
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-green-600 px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
                        >
                            Добавить видео
                        </button>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default ShortsScreen;
