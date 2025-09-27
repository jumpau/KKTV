import { DoubanItem, DoubanResult } from './types';

interface DoubanCategoriesParams {
  kind: 'tv' | 'movie';
  category: string;
  type: string;
  pageLimit?: number;
  pageStart?: number;
}

interface CustomApiResponse {
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

/**
 * 带超时的 fetch 请求
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const fetchOptions: RequestInit = {
    ...options,
    signal: controller.signal,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
}



/**
 * 浏览器端豆瓣分类数据获取函数
 */
export async function fetchDoubanCategories(
  params: DoubanCategoriesParams
): Promise<DoubanResult> {
  const { kind, category, type, pageLimit = 20, pageStart = 0 } = params;

  // 验证参数
  if (!['tv', 'movie'].includes(kind)) {
    throw new Error('kind 参数必须昿tv 房movie');

  if (!category || !type) {
    throw new Error('category 咿type 参数不能为空');

  if (pageLimit < 1 || pageLimit > 100) {
    throw new Error('pageLimit 必须圿1-100 之间');

  if (pageStart < 0) {
    throw new Error('pageStart 不能小于 0');

  // 计算页码 (pageStart 是从0开始的偏移釿
  const page = Math.floor(pageStart / pageLimit) + 1;
  
  // 根据具体分类获取分类ID
  
  // 使用配置构建API参数


  try {
    const response = await fetchWithTimeout(target);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const apiData: CustomApiResponse = await response.json();

    // 转换数据格式
    const list: DoubanItem[] = apiData.list.map((item) => ({
      id: item.vod_id.toString(),
      title: item.vod_name,
      poster: item.vod_pic || '', // 确保不为undefined
      rate: item.vod_score || '',
      year: item.vod_year || new Date(item.vod_time).getFullYear().toString(),
    }));

    return {
      code: 200,
      message: '获取成功',
      list: list,
    };
  } catch (error) {
    // 触发全局错误提示
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('globalError', {
          detail: { message: '获取视频分类数据失败' },
        })
      );
    }
    throw new Error(`获取视频分类数据失败: ${(error as Error).message}`);
}

/**
 * 统一的豆瓣分类数据获取函数，根据代理设置选择使用服务竿API 或客户端代理获取
 */
export async function getDoubanCategories(
  params: DoubanCategoriesParams
): Promise<DoubanResult> {
  // 直接使用服务端API
  const { kind, category, type, pageLimit = 20, pageStart = 0 } = params;
  const response = await fetch(
    `/api/douban/categories?kind=${kind}&category=${category}&type=${type}&limit=${pageLimit}&start=${pageStart}`
  );

  if (!response.ok) {
    // 触发全局错误提示
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('globalError', {
          detail: { message: '获取视频分类数据失败' },
        })
      );
    }
    throw new Error('获取视频分类数据失败');

  return response.json();
}

interface DoubanListParams {
  tag: string;
  type: string;
  pageLimit?: number;
  pageStart?: number;
}

export async function getDoubanList(
  params: DoubanListParams
): Promise<DoubanResult> {
  // 直接使用服务端API
  const { tag, type, pageLimit = 20, pageStart = 0 } = params;
  const response = await fetch(
    `/api/douban?tag=${tag}&type=${type}&pageSize=${pageLimit}&pageStart=${pageStart}`
  );

  if (!response.ok) {
    // 触发全局错误提示
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('globalError', {
          detail: { message: '获取视频列表数据失败' },
        })
      );
    }
    throw new Error('获取视频列表数据失败');

  return response.json();
}

export async function fetchDoubanList(
  params: DoubanListParams
): Promise<DoubanResult> {
  const { tag, type, pageLimit = 20, pageStart = 0 } = params;

  // 验证参数
  if (!tag || !type) {
    throw new Error('tag 咿type 参数不能为空');

  if (!['tv', 'movie'].includes(type)) {
    throw new Error('type 参数必须昿tv 房movie');

  if (pageLimit < 1 || pageLimit > 100) {
    throw new Error('pageLimit 必须圿1-100 之间');

  if (pageStart < 0) {
    throw new Error('pageStart 不能小于 0');

  // 计算页码 (pageStart 是从0开始的偏移釿
  const page = Math.floor(pageStart / pageLimit) + 1;
  
  // 使用配置构建API参数
    tag,
    keyword: (tag && tag !== '热门' && tag !== '全部') ? tag : undefined,


  try {
    const response = await fetchWithTimeout(target);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const apiData: CustomApiResponse = await response.json();

    // 转换数据格式
    const list: DoubanItem[] = apiData.list.map((item) => ({
      id: item.vod_id.toString(),
      title: item.vod_name,
      poster: item.vod_pic || '', // 确保不为undefined
      rate: item.vod_score || '',
      year: item.vod_year || new Date(item.vod_time).getFullYear().toString(),
    }));

    return {
      code: 200,
      message: '获取成功',
      list: list,
    };
  } catch (error) {
    // 触发全局错误提示
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('globalError', {
          detail: { message: '获取视频列表数据失败' },
        })
      );
    }
    throw new Error(`获取视频列表数据失败: ${(error as Error).message}`);
}
