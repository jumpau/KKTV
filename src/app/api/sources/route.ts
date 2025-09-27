import { NextResponse } from 'next/server';

// 移除edge运行时，使用默认的Node.js运行时
// export const runtime = 'edge';

interface ConfigData {
  api_site: Record<string, {
    api: string;
    name: string;
    detail?: string;
  }>;
}

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

interface SourceApiResponse {
  code: number;
  msg: string;
  page: number;
  pagecount: number;
  limit: number;
  total: number;
  list: SourceVideoItem[];
  class?: SourceCategory[];
}

// 获取配置文件
function getConfig(): ConfigData {
  try {
    // 直接使用硬编码的配置，避免文件系统操作
    return {
      api_site: {
        "dyttzy": {
          "api": "http://caiji.dyttzyapi.com/api.php/provide/vod",
          "name": "电影天堂资源",
          "detail": "http://caiji.dyttzyapi.com"
        },
        "heimuer": {
          "api": "https://json.heimuer.xyz/api.php/provide/vod",
          "name": "黑木耳",
          "detail": "https://heimuer.tv"
        },
        "ruyi": {
          "api": "http://cj.rycjapi.com/api.php/provide/vod",
          "name": "如意资源"
        },
        "bfzy": {
          "api": "https://bfzyapi.com/api.php/provide/vod",
          "name": "暴风资源"
        },
        "tyyszy": {
          "api": "https://tyyszy.com/api.php/provide/vod",
          "name": "天涯资源"
        },
        "ffzy": {
          "api": "http://ffzy5.tv/api.php/provide/vod",
          "name": "非凡影视",
          "detail": "http://ffzy5.tv"
        },
        "zy360": {
          "api": "https://360zy.com/api.php/provide/vod",
          "name": "360资源"
        },
        "maotaizy": {
          "api": "https://caiji.maotaizy.cc/api.php/provide/vod",
          "name": "茅台资源"
        },
        "wolong": {
          "api": "https://wolongzyw.com/api.php/provide/vod",
          "name": "卧龙资源"
        },
        "jisu": {
          "api": "https://jszyapi.com/api.php/provide/vod",
          "name": "极速资源",
          "detail": "https://jszyapi.com"
        }
      }
    };
  } catch (error) {
    console.error('获取配置失败:', error);
    return { api_site: {} };
  }
}

// 获取所有资源站点列表
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'list') {
    // 返回所有资源站点
    const config = getConfig();
    const sources = Object.entries(config.api_site).map(([key, site]) => ({
      id: key,
      name: site.name,
      api: site.api,
      detail: site.detail || ''
    }));
    
    return NextResponse.json({
      code: 200,
      message: '获取成功',
      data: sources
    });
  }
  
  if (action === 'categories') {
    // 获取指定源的分类
    const sourceId = searchParams.get('source');
    if (!sourceId) {
      return NextResponse.json({
        code: 400,
        message: '缺少source参数'
      }, { status: 400 });
    }
    
    const config = getConfig();
    const source = config.api_site[sourceId];
    
    if (!source) {
      return NextResponse.json({
        code: 404,
        message: '资源站不存在'
      }, { status: 404 });
    }
    
    try {
      // 调用资源站的分类接口
      const response = await fetch(`${source.api}/?ac=list`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data: SourceApiResponse = await response.json();
      
      return NextResponse.json({
        code: 200,
        message: '获取成功',
        data: {
          categories: data.class || [],
          total: data.total || 0
        }
      });
      
    } catch (error) {
      console.error(`获取${source.name}分类失败:`, error);
      return NextResponse.json({
        code: 500,
        message: `获取${source.name}分类失败`
      }, { status: 500 });
    }
  }
  
  if (action === 'videos') {
    // 获取视频列表
    const sourceId = searchParams.get('source');
    const typeId = searchParams.get('t') || '';
    const page = parseInt(searchParams.get('pg') || '1');
    const pageSize = parseInt(searchParams.get('pagesize') || '20');
    const keyword = searchParams.get('wd') || '';
    
    if (!sourceId) {
      return NextResponse.json({
        code: 400,
        message: '缺少source参数'
      }, { status: 400 });
    }
    
    const config = getConfig();
    const source = config.api_site[sourceId];
    
    if (!source) {
      return NextResponse.json({
        code: 404,
        message: '资源站不存在'
      }, { status: 404 });
    }
    
    try {
      // 构建API URL
      let apiUrl = `${source.api}/?ac=detail&pg=${page}&pagesize=${pageSize}`;
      if (typeId) apiUrl += `&t=${typeId}`;
      if (keyword) apiUrl += `&wd=${encodeURIComponent(keyword)}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data: SourceApiResponse = await response.json();
      
      return NextResponse.json({
        code: 200,
        message: '获取成功',
        data: {
          list: data.list || [],
          page: data.page || 1,
          pagecount: data.pagecount || 1,
          total: data.total || 0,
          limit: data.limit || pageSize
        }
      });
      
    } catch (error) {
      console.error(`获取${source.name}视频失败:`, error);
      return NextResponse.json({
        code: 500,
        message: `获取${source.name}视频失败`
      }, { status: 500 });
    }
  }
  
  return NextResponse.json({
    code: 400,
    message: '无效的action参数'
  }, { status: 400 });
}
