'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { ChevronLeft } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import VideoCard from '@/components/VideoCard';

interface Category {
  type_id: number;
  type_name: string;
}

interface VideoItem {
  vod_id: number;
  vod_name: string;
  vod_pic: string;
  vod_year?: string;
  type_name?: string;
}

interface Source {
  id: string;
  name: string;
}

interface Category {
  type_id: number;
  type_name: string;
}

export default function SourceDetailPage() {
  const params = useParams();
  const sourceId = params?.sourceId as string;
  
  const [source, setSource] = useState<Source | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 获取分类
  useEffect(() => {
    if (!sourceId) return;

    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/sources', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceId: sourceId,
            action: 'categories',
            params: {
              ac: 'list'
            }
          }),
        });

        const result = await response.json();
        if (result.code === 200) {
          setSource(result.source);
          if (result.data && result.data.class && Array.isArray(result.data.class)) {
            setCategories(result.data.class);
          }
        }
      } catch (error) {
        console.error('获取分类失败:', error);
      }
    };

    fetchCategories();
  }, [sourceId]);

  // 获取视频数据
  const fetchVideos = useCallback(async (page: number, categoryId?: number, reset = false): Promise<void> => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const requestParams = {
        pg: page,
        pagesize: 23,
        ...(categoryId && { t: categoryId })
      };
      const response = await fetch('/api/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceId: sourceId,
          action: 'videos',
          params: requestParams
        }),
      });

      const result = await response.json();

      if (result.code === 200) {
        if (!source) setSource(result.source);
        
        let videoList: VideoItem[] = [];
        if (result.data && result.data.list) {
          videoList = result.data.list;
        } else if (result.data && Array.isArray(result.data)) {
          videoList = result.data;
        } else if (Array.isArray(result.data)) {
          videoList = result.data;
        }

        if (videoList && videoList.length > 0) {
          if (reset || page === 1) {
            setVideos(videoList);
          } else {
            setVideos((prev: VideoItem[]) => [...prev, ...videoList]);
          }
          
          // 判断是否还有更多数据
          const hasMoreData = videoList.length === 23;
          setHasMore(hasMoreData);

        } else {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sourceId, source]);

  // 初始加载视频
  useEffect(() => {
    if (!sourceId) return;
    fetchVideos(1, selectedCategory || undefined, true);
    setCurrentPage(1);
  }, [sourceId, selectedCategory, fetchVideos]);

  // 无限滚动 - 使用state管理加载状态
  useEffect(() => {
    let lastTriggerTime = 0;
    
    // 获取滚动位置的函数 - 专门针对 body 滚动
    const getScrollTop = () => {
      return document.body.scrollTop || 0;
    };

    const handleScroll = () => {
      const now = Date.now();
      // 节流控制
      if (now - lastTriggerTime < 1000) return;
      
      const scrollTop = getScrollTop();
      const windowHeight = window.innerHeight;
      const documentHeight = document.body.scrollHeight;
      const distanceFromBottom = documentHeight - (scrollTop + windowHeight);

      // 检查是否应该触发加载 - 使用组件状态而不是局部变量
      if (!loadingMore && hasMore && distanceFromBottom < 300) {
        lastTriggerTime = now;
        
        setCurrentPage((prev: number) => {
          const nextPage = prev + 1;
          fetchVideos(nextPage, selectedCategory || undefined);
          return nextPage;
        });
      }
    };

    document.body.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      document.body.removeEventListener('scroll', handleScroll);
    };
  }, [loadingMore, hasMore, currentPage, selectedCategory, fetchVideos]); // 依赖关键状态

  // 处理分类切换
  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setVideos([]);
    setCurrentPage(1);
    setHasMore(true);
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="p-8 text-center">
          <p>加载中...</p>
        </div>
      </PageLayout>
    );
  }

  if (!source) {
    return (
      <PageLayout>
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">线路不存在</h2>
          <Link href="/sources" className="text-blue-500 hover:text-blue-600">
            返回线路列表
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="p-8">
        <div className="flex items-center mb-6">
          <Link href="/sources" className="flex items-center text-gray-600 hover:text-gray-800 mr-4">
            <ChevronLeft className="w-5 h-5" />
            返回
          </Link>
          <h1 className="text-2xl font-bold">{source.name}</h1>
        </div>
        
        {/* 分类选择器 */}
        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryChange(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === null
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                全部
              </button>
              {categories.map((category) => (
                <button
                  key={category.type_id}
                  onClick={() => handleCategoryChange(category.type_id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.type_id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {category.type_name}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-x-2 gap-y-6 sm:gap-y-8 px-0 sm:px-2 sm:grid-cols-[repeat(auto-fill,_minmax(11rem,_1fr))] sm:gap-x-4">
          {videos.map((video) => (
            <div key={video.vod_id} className="w-full">
              <VideoCard
                from="search"
                id={String(video.vod_id)}
                source={sourceId}
                title={video.vod_name}
                poster={video.vod_pic}
                year={video.vod_year}
                source_name={source.name}
                episodes={1}
              />
            </div>
          ))}
        </div>
        
        {/* 加载更多指示器 */}
        {loadingMore && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-600">加载中...</span>
            </div>
          </div>
        )}
        
        {!hasMore && videos.length > 0 && (
          <div className="text-center text-gray-500 py-8">
            已加载全部内容
          </div>
        )}
        
        {videos.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-12">
            该线路暂无视频内容
          </div>
        )}
        

      </div>
    </PageLayout>
  );
}

export const runtime = 'edge';
