'use client';

import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import PageLayout from '@/components/PageLayout';
import VideoCard from '@/components/VideoCard';

interface Category {
  type_id: number;
  type_pid: number;
  type_name: string;
}

interface VideoItem {
  vod_id: number;
  vod_name: string;
  type_id: number;
  type_name: string;
  vod_pic: string;
  vod_remarks: string;
  vod_year?: string;
  vod_score?: string;
}

interface Source {
  id: string;
  name: string;
}

export default function SourceDetailPage() {
  const params = useParams();
  const sourceId = params?.sourceId as string;
  
  const [source, setSource] = useState<Source | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (sourceId) {
      fetchSourceData();
    }
  }, [sourceId]);

  useEffect(() => {
    if (selectedCategory !== null) {
      fetchVideos(true);
    }
  }, [selectedCategory]);

  const fetchSourceData = async () => {
    try {
      setLoading(true);

      // 获取分类
      const categoriesResponse = await fetch('/api/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceId: sourceId,
          action: 'categories'
        }),
      });

      const categoriesResult = await categoriesResponse.json();
      if (categoriesResult.code === 200) {
        setSource(categoriesResult.source);
        
        if (categoriesResult.data.class) {
          setCategories(categoriesResult.data.class);
        }

        // 默认获取所有视频
        fetchVideos(true);
      }
    } catch (error) {
      console.error('获取线路数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async (reset = false) => {
    try {
      setVideosLoading(true);
      const currentPage = reset ? 1 : page;

      const params: any = {
        pg: currentPage,
        pagesize: 24
      };

      if (selectedCategory !== null && selectedCategory !== 0) {
        params.t = selectedCategory;
      }

      const response = await fetch('/api/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceId: sourceId,
          action: 'videos',
          params: params
        }),
      });

      const result = await response.json();
      if (result.code === 200 && result.data.list) {
        const newVideos = result.data.list;
        
        if (reset) {
          setVideos(newVideos);
          setPage(2);
        } else {
          setVideos(prev => [...prev, ...newVideos]);
          setPage(prev => prev + 1);
        }

        // 检查是否还有更多数据
        setHasMore(newVideos.length === 24);
      }
    } catch (error) {
      console.error('获取视频列表失败:', error);
    } finally {
      setVideosLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategory(categoryId);
    setPage(1);
    setHasMore(true);
  };

  const loadMore = () => {
    if (hasMore && !videosLoading) {
      fetchVideos(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (!source) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              线路不存在
            </h2>
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              返回首页
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="px-2 sm:px-10 py-4 sm:py-8">
        <div className="max-w-[95%] mx-auto">
          {/* 返回按钮和标题 */}
          <div className="flex items-center mb-6">
            <Link 
              href="/"
              className="flex items-center text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 mr-4"
            >
              <ChevronLeft className="w-5 h-5" />
              返回
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {source.name}
            </h1>
          </div>

          {/* 分类选择 */}
          {categories.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
                选择分类
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategoryChange(0)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === 0 || selectedCategory === null
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  全部
                </button>
                {categories
                  .filter(cat => cat.type_pid === 0)
                  .map((category) => (
                    <button
                      key={category.type_id}
                      onClick={() => handleCategoryChange(category.type_id)}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === category.type_id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {category.type_name}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* 视频网格 */}
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

          {/* 加载更多 */}
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={videosLoading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {videosLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    加载中...
                  </div>
                ) : (
                  '加载更多'
                )}
              </button>
            </div>
          )}

          {/* 没有更多内容提示 */}
          {!hasMore && videos.length > 0 && (
            <div className="text-center mt-8 text-gray-500 dark:text-gray-400">
              没有更多内容了
            </div>
          )}

          {/* 空状态 */}
          {videos.length === 0 && !videosLoading && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              暂无视频内容
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}