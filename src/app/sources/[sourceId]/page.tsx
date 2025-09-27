'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ChevronLeft } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import VideoCard from '@/components/VideoCard';

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

export default function SourceDetailPage() {
  const params = useParams();
  const sourceId = params?.sourceId as string;
  
  const [source, setSource] = useState<Source | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sourceId) return;

    const fetchData = async () => {
      try {
        // 获取视频数据
        const response = await fetch('/api/sources', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceId: sourceId,
            action: 'videos',
            params: {
              pg: 1,
              pagesize: 24
            }
          }),
        });

        const result = await response.json();
        if (result.code === 200) {
          setSource(result.source);
          if (result.data.list) {
            setVideos(result.data.list);
          }
        }
      } catch (error) {
        // 获取失败
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sourceId]);

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
        
        {videos.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            该线路暂无视频内容
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export const runtime = 'edge';
