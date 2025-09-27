/**
 * 资源站数据获取工具函数
 * 明确区分需要分类和不需要分类的使用场景
 */

export interface SourceData {
  id: string;
  name: string;
  api: string;
  detail: string;
}

export interface SourceVideoItem {
  vod_id: number;
  vod_name: string;
  type_id: number;
  type_name: string;
  vod_pic?: string;
  vod_year?: string;
  vod_remarks?: string;
  vod_class?: string;
}

export interface SourceCategory {
  type_id: number;
  type_pid: number;
  type_name: string;
}

/**
 * 获取资源站列表 - 不需要分类
 */
export async function getSourceList(): Promise<SourceData[]> {
  try {
    const response = await fetch('/api/sources?action=list');
    if (!response.ok) throw new Error('获取资源站列表失败');
    
    const result = await response.json();
    return result.code === 200 ? result.data : [];
  } catch (error) {
    console.error('获取资源站列表失败:', error);
    return [];
  }
}

/**
 * 获取资源站最新视频 - 不需要分类（用于主页展示）
 * @param sourceId 资源站ID
 * @param limit 获取数量，默认8个
 */
export async function getLatestVideos(sourceId: string, limit: number = 8): Promise<SourceVideoItem[]> {
  try {
    // 主页场景：不使用分类筛选，获取最新内容
    const response = await fetch(`/api/sources?action=videos&source=${sourceId}&pagesize=${limit}`);
    if (!response.ok) throw new Error(`获取${sourceId}最新视频失败`);
    
    const result = await response.json();
    return result.code === 200 ? result.data.list || [] : [];
  } catch (error) {
    console.error(`获取${sourceId}最新视频失败:`, error);
    return [];
  }
}

/**
 * 获取资源站分类列表 - 仅在需要分类筛选时使用
 * @param sourceId 资源站ID
 */
export async function getSourceCategories(sourceId: string): Promise<SourceCategory[]> {
  try {
    const response = await fetch(`/api/sources?action=categories&source=${sourceId}`);
    if (!response.ok) throw new Error('获取分类失败');
    
    const result = await response.json();
    return result.code === 200 ? result.data.categories || [] : [];
  } catch (error) {
    console.error('获取分类失败:', error);
    return [];
  }
}

/**
 * 获取分类下的视频列表 - 需要分类（用于分类浏览）
 * @param sourceId 资源站ID
 * @param categoryId 分类ID（可选，为空则获取所有分类）
 * @param page 页码
 * @param pageSize 每页数量
 */
export async function getVideosByCategory(
  sourceId: string, 
  categoryId: string = '', 
  page: number = 1, 
  pageSize: number = 20
): Promise<{
  list: SourceVideoItem[];
  page: number;
  pagecount: number;
  total: number;
}> {
  try {
    let url = `/api/sources?action=videos&source=${sourceId}&pg=${page}&pagesize=${pageSize}`;
    if (categoryId) {
      url += `&t=${categoryId}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('获取视频列表失败');
    
    const result = await response.json();
    if (result.code === 200) {
      return {
        list: result.data.list || [],
        page: result.data.page || 1,
        pagecount: result.data.pagecount || 1,
        total: result.data.total || 0
      };
    }
    
    return { list: [], page: 1, pagecount: 1, total: 0 };
  } catch (error) {
    console.error('获取视频列表失败:', error);
    return { list: [], page: 1, pagecount: 1, total: 0 };
  }
}

/**
 * 搜索视频 - 不强制分类（可选分类作为筛选条件）
 * @param sourceId 资源站ID
 * @param keyword 搜索关键词
 * @param categoryId 可选的分类ID
 * @param page 页码
 * @param pageSize 每页数量
 */
export async function searchVideos(
  sourceId: string, 
  keyword: string, 
  categoryId: string = '', 
  page: number = 1, 
  pageSize: number = 20
): Promise<{
  list: SourceVideoItem[];
  page: number;
  pagecount: number;
  total: number;
}> {
  try {
    let url = `/api/sources?action=videos&source=${sourceId}&wd=${encodeURIComponent(keyword)}&pg=${page}&pagesize=${pageSize}`;
    if (categoryId) {
      url += `&t=${categoryId}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('搜索失败');
    
    const result = await response.json();
    if (result.code === 200) {
      return {
        list: result.data.list || [],
        page: result.data.page || 1,
        pagecount: result.data.pagecount || 1,
        total: result.data.total || 0
      };
    }
    
    return { list: [], page: 1, pagecount: 1, total: 0 };
  } catch (error) {
    console.error('搜索失败:', error);
    return { list: [], page: 1, pagecount: 1, total: 0 };
  }
}

/**
 * 使用场景说明：
 * 
 * 不需要分类的场景：
 * 1. 主页展示最新内容 - 使用 getLatestVideos()
 * 2. 获取资源站列表 - 使用 getSourceList()
 * 3. 全局搜索 - 使用 searchVideos() 不传 categoryId
 * 4. 收藏和播放记录 - 基于用户数据，不涉及原始分类
 * 
 * 需要分类的场景：
 * 1. 分类浏览页面 - 使用 getSourceCategories() 获取分类，getVideosByCategory() 获取内容
 * 2. 分类筛选搜索 - 使用 searchVideos() 传入 categoryId
 * 3. 按分类推荐 - 使用 getVideosByCategory() 指定分类
 */
