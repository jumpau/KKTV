import { NextResponse } from 'next/server';

import { getCacheTime } from '@/lib/config';
import { DoubanItem, DoubanResult } from '@/lib/types';
import { buildApiParams, getApiUrl } from '@/lib/custom-api.config';

interface CustomCategoryApiResponse {
  code: number;
  msg?: string;
  page?: number;
  pagecount?: number;
  limit?: number;
  total?: number;
  list: Array<{
    vod_id: number;
    vod_name: string;
    type_id: number;
    type_name: string;
    vod_en: string;
    vod_time: string;
    vod_remarks: string;
    vod_play_from: string;
    vod_pic?: string;
    vod_score?: string;
    vod_year?: string;
  }>;
  class?: Array<{
    type_id: number;
    type_pid: number;
    type_name: string;
  }>;
}

async function fetchCustomApiData(
  url: string
): Promise<CustomCategoryApiResponse> {
  // 添加超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

  // 设置请求选项，包括信号和头部
  const fetchOptions = {
    signal: controller.signal,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
    },
  };

  try {
    // 访问自定义API
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // 获取参数
  const kind = searchParams.get('kind') || 'movie';
  const category = searchParams.get('category');
  const type = searchParams.get('type');
  const pageLimit = parseInt(searchParams.get('limit') || '20');
  const pageStart = parseInt(searchParams.get('start') || '0');

  // 验证参数
  if (!kind || !category || !type) {
    return NextResponse.json(
      { error: '缺少必要参数: kind 或 category 或 type' },
      { status: 400 }
    );
  }


  if (pageLimit < 1 || pageLimit > 100) {
    return NextResponse.json(
      { error: 'pageSize 必须在 1-100 之间' },
      { status: 400 }
    );
  }

  if (pageStart < 0) {
    return NextResponse.json(
      { error: 'pageStart 不能小于 0' },
      { status: 400 }
    );
  }

  // 计算页码 (pageStart 是从0开始的偏移量)
  const page = Math.floor(pageStart / pageLimit) + 1;
  
  // 使用配置构建API参数
  const apiParams = buildApiParams({
    type: kind as 'movie' | 'tv',
    category: category || undefined,
    tag: type || undefined,
    page,
    pageSize: pageLimit,
  });

  const target = getApiUrl(apiParams);

  try {
    // 调用自定义 API
    const apiData = await fetchCustomApiData(target);

    // 转换数据格式
    const list: DoubanItem[] = apiData.list.map((item) => ({
      id: item.vod_id.toString(),
      title: item.vod_name,
      poster: item.vod_pic || '', // 确保不为undefined
      rate: item.vod_score || '',
      year: item.vod_year || new Date(item.vod_time).getFullYear().toString(),
    }));

    const response: DoubanResult = {
      code: 200,
      message: '获取成功',
      list: list,
    };

    const cacheTime = await getCacheTime();
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
        'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
        'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: '获取视频数据失败', details: (error as Error).message },
      { status: 500 }
    );
  }
}
