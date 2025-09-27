/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';

import { getConfig } from '@/lib/config';

export const runtime = 'edge';

// 获取所有线路
export async function GET() {
  try {
    const config = await getConfig();
    
    const sources = config.SourceConfig.filter(s => !s.disabled).map(source => ({
      id: source.key,
      name: source.name,
      api: source.api,
      detail: source.detail
    }));

    return NextResponse.json({
      code: 200,
      message: 'success',
      data: sources
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('获取线路失败:', error);
    return NextResponse.json(
      { code: 500, message: '获取线路失败', error: String(error) },
      { status: 500 }
    );
  }
}

// 获取指定线路的分类和视频数据
export async function POST(request: Request) {
  try {
    const { sourceId, action, params } = await request.json();
    
    if (!sourceId) {
      return NextResponse.json(
        { code: 400, message: '缺少线路ID' },
        { status: 400 }
      );
    }

    const config = await getConfig();
    const source = config.SourceConfig.find(s => s.key === sourceId && !s.disabled);
    
    if (!source) {
      return NextResponse.json(
        { code: 404, message: '线路不存在或已禁用' },
        { status: 404 }
      );
    }

    let url = source.api;
    
    if (action === 'categories') {
      // 获取分类信息 - 使用ac=list来获取分类
      const searchParams = new URLSearchParams({
        ac: 'list',
        at: 'json'
      });
      // 添加额外参数（如果有）
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && key !== 'ac') {
            searchParams.set(key, String(value));
          }
        });
      }
      url += '/?' + searchParams.toString();
    } else if (action === 'videos') {
      // 获取视频列表 - 使用ac=videolist来获取视频
      const searchParams = new URLSearchParams({
        ac: 'videolist',
        at: 'json'
      });
      // 添加额外参数（如果有）
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && key !== 'ac') {
            searchParams.set(key, String(value));
          }
        });
      }
      url += '/?' + searchParams.toString();
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });


    if (!response.ok) {
      console.error(`❌ API请求失败: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      code: 200,
      message: 'success',
      data: data,
      source: {
        id: sourceId,
        name: source.name
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('获取数据失败:', error);
    return NextResponse.json(
      { code: 500, message: '获取数据失败', error: String(error) },
      { status: 500 }
    );
  }
}

