'use client';

import { ChevronRight, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

import PageLayout from '@/components/PageLayout';
import VideoCard from '@/components/VideoCard';

interface SourceCategory {
  type_id: number;
  type_pid: number;
  type_name: string;
}

interface SourceVideoItem {
  vod_id: number;
  vod_name: string;
  type_id: number;
  type_name: string;
  vod_en?: string;
  vod_time: string;
  vod_remarks: string;
  vod_play_from?: string;
  vod_pic?: string;
  vod_area?: string;
  vod_year?: string;
  vod_actor?: string;
  vod_director?: string;
  vod_blurb?: string;
  vod_score?: string;
  vod_class?: string;
}

interface SourceData {
  id: string;
  name: string;
  api: string;
  detail: string;
}

function SourcePageClient() {
  const searchParams = useSearchParams();
  const sourceId = searchParams.get('source') || '';
  
  const [sources, setSources] = useState<SourceData[]>([]);
  const [categories, setCategories] = useState<SourceCategory[]>([]);
  const [videos, setVideos] = useState<SourceVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>(sourceId);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 获取资源站列表
  const fetchSources = useCallback(async () => {
    try {
      const response = await fetch('/api/sources?action=list');
      if (!response.ok) throw new Error('获取资源站列表失败');
      
      const result = await response.json();
      if (result.code === 200) {
        setSources(result.data);
        if (!selectedSource && result.data.length > 0) {
          setSelectedSource(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('获取资源站列表失败:', error);
    }
  }, [selectedSource]);

  // 获取分类列表
  const fetchCategories = useCallback(async (source: string) => {
    if (!source) return;
    
    try {
      const response = await fetch(`/api/sources?action=categories&source=${source}`);
      if (!response.ok) throw new Error('获取分类失败');
      
      const result = await response.json();
      if (result.code === 200) {
        setCategories(result.data.categories || []);
        setSelectedCategory(''); // 重置分类选择
      }
    } catch (error) {
      console.error('获取分类失败:', error);
      setCategories([]);
    }
  }, []);

  // 获取视频列表
  const fetchVideos = useCallback(async (source: string, categoryId: string = '', page: number = 1, append: boolean = false) => {
    if (!source) return;
    
    setLoadingVideos(true);
    
    try {
      let url = `/api/sources?action=videos&source=${source}&pg=${page}&pagesize=20`;
      if (categoryId) {
        url += `&t=${categoryId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('获取视频列表失败');
      
      const result = await response.json();
      if (result.code === 200) {
        const newVideos = result.data.list || [];
        
        if (append) {
          setVideos(prev => [...prev, ...newVideos]);
        } else {
          setVideos(newVideos);
        }
        
        setCurrentPage(result.data.page || 1);
        setTotalPages(result.data.pagecount || 1);
        setHasMore(page < (result.data.pagecount || 1));
      }
    } catch (error) {
      console.error('获取视频列表失败:', error);
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  // 加载更多
  const loadMore = useCallback(() => {
    if (hasMore && !loadingVideos) {
      fetchVideos(selectedSource, selectedCategory, currentPage + 1, true);
    }
  }, [hasMore, loadingVideos, selectedSource, selectedCategory, currentPage, fetchVideos]);

  // 初始化
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchSources();
      setLoading(false);
    };
    
    init();
  }, [fetchSources]);

  // 资源站变化时获取分类和视频
  useEffect(() => {
    if (selectedSource) {
      fetchCategories(selectedSource);
      fetchVideos(selectedSource, '', 1);
    }
  }, [selectedSource, fetchCategories, fetchVideos]);

  // 分类变化时获取视频
  useEffect(() => {
    if (selectedSource) {
      fetchVideos(selectedSource, selectedCategory, 1);
    }
  }, [selectedCategory, selectedSource, fetchVideos]);

  // 获取主分类（父级分类）
  const mainCategories = categories.filter(cat => cat.type_pid === 0);
  
  // 获取子分类
  const getSubCategories = (parentId: number) => {
    return categories.filter(cat => cat.type_pid === parentId);
  };

  const currentSource = sources.find(s => s.id === selectedSource);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* 资源站选择 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
            选择资源站
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {sources.map((source) => (
              <button
                key={source.id}
                onClick={() => setSelectedSource(source.id)}
                className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSource === source.id
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {source.name}
              </button>
            ))}
          </div>
        </div>

        {/* 分类选择 */}
        {categories.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
              选择分类
            </h3>
            
            {/* 全部分类按钮 */}
            <div className="mb-3">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1 rounded-full text-sm mr-2 mb-2 transition-colors ${
                  selectedCategory === ''
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                全部
              </button>
            </div>

            {/* 主分类 */}
            {mainCategories.map((category) => {
              const subCategories = getSubCategories(category.type_id);
              
              return (
                <div key={category.type_id} className="mb-4">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    {category.type_name}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory(category.type_id.toString())}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedCategory === category.type_id.toString()
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      全部{category.type_name}
                    </button>
                    
                    {subCategories.map((subCategory) => (
                      <button
                        key={subCategory.type_id}
                        onClick={() => setSelectedCategory(subCategory.type_id.toString())}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedCategory === subCategory.type_id.toString()
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {subCategory.type_name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 当前资源站信息 */}
        {currentSource && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {currentSource.name}
            </h3>
            {selectedCategory && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                当前分类: {categories.find(c => c.type_id.toString() === selectedCategory)?.type_name || '全部'}
              </p>
            )}
          </div>
        )}

        {/* 视频列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          {loadingVideos && videos.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : videos.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {videos.map((video) => (
                  <VideoCard
                    key={`${selectedSource}-${video.vod_id}`}
                    id={video.vod_id.toString()}
                    source={selectedSource}
                    title={video.vod_name}
                    poster={video.vod_pic || ''}
                    year={video.vod_year || ''}
                    source_name={currentSource?.name || ''}
                  />
                ))}
              </div>
              
              {/* 加载更多按钮 */}
              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingVideos}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                  >
                    {loadingVideos && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loadingVideos ? '加载中...' : '加载更多'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              暂无视频数据
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default function SourcePage() {
  return (
    <Suspense fallback={
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      </PageLayout>
    }>
      <SourcePageClient />
    </Suspense>
  );
}
