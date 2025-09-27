'use client';

import { ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import PageLayout from '@/components/PageLayout';
import ScrollableRow from '@/components/ScrollableRow';
import VideoCard from '@/components/VideoCard';

interface Source {
  id: string;
  name: string;
  api: string;
  detail?: string;
}

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

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // 获取所有线路
  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/sources');
      const result = await response.json();
      
      if (result.code === 200) {
        setSources(result.data);
        // 自动选择第一个线路
        if (result.data.length > 0) {
          handleSourceSelect(result.data[0]);
        }
      }
    } catch (error) {
      console.error('获取线路失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSourceSelect = async (source: Source) => {
    setSelectedSource(source);
    setLoadingVideos(true);
    
    try {
      // 获取分类
      const categoriesResponse = await fetch('/api/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceId: source.id,
          action: 'categories'
        }),
      });
      
      const categoriesResult = await categoriesResponse.json();
      if (categoriesResult.code === 200 && categoriesResult.data.class) {
        setCategories(categoriesResult.data.class);
      }

      // 获取视频列表
      const videosResponse = await fetch('/api/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceId: source.id,
          action: 'videos',
          params: {
            pg: 1,
            pagesize: 20
          }
        }),
      });
      
      const videosResult = await videosResponse.json();
      if (videosResult.code === 200 && videosResult.data.list) {
        setVideos(videosResult.data.list);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoadingVideos(false);
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

  return (
    <PageLayout>
      <div className="px-2 sm:px-10 py-4 sm:py-8">
        <div className="max-w-[95%] mx-auto">
          {/* 线路选择 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              选择线路
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {sources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => handleSourceSelect(source)}
                  className={`p-4 rounded-lg border transition-colors ${
                    selectedSource?.id === source.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-sm font-medium text-center">
                    {source.name}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {selectedSource && (
            <>
              {/* 分类显示 */}
              {categories.length > 0 && (
                <section className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
                    {selectedSource.name} - 分类
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categories
                      .filter(cat => cat.type_pid === 0) // 只显示主分类
                      .map((category) => (
                        <Link
                          key={category.type_id}
                          href={`/sources/${selectedSource.id}/category/${category.type_id}`}
                          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          {category.type_name}
                        </Link>
                      ))}
                  </div>
                </section>
              )}

              {/* 最新视频 */}
              <section className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {selectedSource.name} - 最新视频
                  </h3>
                  <Link
                    href={`/sources/${selectedSource.id}`}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    查看更多
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
                
                {loadingVideos ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <ScrollableRow>
                    {videos.map((video) => (
                      <div
                        key={video.vod_id}
                        className="min-w-[96px] w-24 sm:min-w-[180px] sm:w-44"
                      >
                        <VideoCard
                          from="search"
                          id={String(video.vod_id)}
                          source={selectedSource.id}
                          title={video.vod_name}
                          poster={video.vod_pic}
                          year={video.vod_year}
                          source_name={selectedSource.name}
                          episodes={1} // 默认为1，实际应该从API获取
                        />
                      </div>
                    ))}
                  </ScrollableRow>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}