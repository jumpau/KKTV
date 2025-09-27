'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';

interface Source {
  id: string;
  name: string;
  api: string;
  detail?: string;
}

export default function SourcesPageContent() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch('/api/sources');
        const result = await response.json();
        
        if (result.code === 200) {
          setSources(result.data);
        }
      } catch (error) {
        // 获取失败
      } finally {
        setLoading(false);
      }
    };

    fetchSources();
  }, []);

  if (loading) {
    return (
      <PageLayout>
        <div className="p-8 text-center">
          <p>加载中...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="p-8">
        <div className="flex items-center mb-6">
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-800 mr-4">
            <ChevronLeft className="w-5 h-5" />
            返回首页
          </Link>
          <h1 className="text-2xl font-bold">所有线路</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sources.map((source) => (
            <div key={source.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold mb-2">{source.name}</h3>
              <p className="text-sm text-gray-600 mb-4">线路ID: {source.id}</p>
              <Link
                href={`/sources/${source.id}`}
                className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                进入线路
              </Link>
            </div>
          ))}
        </div>
        
        {sources.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            暂无可用线路
          </div>
        )}
      </div>
    </PageLayout>
  );
}
