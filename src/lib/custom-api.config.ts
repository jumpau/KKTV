/**
 * 自定义API配置
 */

// API基础URL
export const CUSTOM_API_BASE_URL = 'https://aiopen.qzz.io/api.php/provide/vod/';

// 根据实际API返回的分类数据映射
export const CATEGORY_MAPPING = {
  movie: '1', // 电影分类ID（根据API返回的class数据）
  tv: '2',    // 分类2ID
} as const;

// 实际API返回的分类映射（基于返回的class数据）
export const CATEGORY_NAME_MAPPING: Record<string, string> = {
  '喜剧': '6',
  '爱情': '7', 
  '恐怖': '8',
  '动作': '9',
  '科幻': '10',
  '全部': '', // 不设置分类ID，获取全部
};

// 从API获取的实际分类结构
export const API_CATEGORIES = {
  1: '电影',
  2: '分类2', 
  3: '分类3',
  4: '分类4',
  5: '分类5',
  6: '喜剧',
  7: '爱情', 
  8: '恐怖',
  9: '动作',
  10: '科幻',
};

// 从实际API响应解析的完整分类列表
export const FULL_CATEGORIES = [
  { type_id: 1, type_pid: 0, type_name: '电影' },
  { type_id: 2, type_pid: 0, type_name: '分类2' },
  { type_id: 6, type_pid: 1, type_name: '喜剧' },
  { type_id: 7, type_pid: 1, type_name: '爱情' },
  { type_id: 8, type_pid: 1, type_name: '恐怖' },
  { type_id: 9, type_pid: 1, type_name: '动作' },
  { type_id: 10, type_pid: 1, type_name: '科幻' },
];

/**
 * 构建自定义API请求参数
 */
export function buildApiParams(options: {
  type?: 'movie' | 'tv';
  category?: string;
  tag?: string;
  page: number;
  pageSize: number;
  keyword?: string;
  typeId?: string;
}): URLSearchParams {
  const { category, tag, page, pageSize, keyword, typeId } = options;
  
  const params = new URLSearchParams({
    ac: 'list',
    pg: page.toString(),
    limit: pageSize.toString(),
  });

  // 如果指定了具体的分类ID，使用它
  if (typeId) {
    params.set('t', typeId);
  } else if (category && CATEGORY_NAME_MAPPING[category]) {
    // 根据分类名称获取分类ID
    params.set('t', CATEGORY_NAME_MAPPING[category]);
  }

  // 处理搜索关键词
  if (keyword) {
    params.set('wd', keyword);
  } else if (tag && tag !== '全部' && tag !== '热门') {
    params.set('wd', tag);
  }

  return params;
}

/**
 * 生成默认海报URL（当API不提供海报图片时使用）
 */
export function getDefaultPosterUrl(title: string): string {
  // 可以返回一个默认图片或根据标题生成占位符
  return `/api/placeholder?text=${encodeURIComponent(title)}&width=300&height=450`;
}

/**
 * 获取完整的API请求URL
 */
export function getApiUrl(params: URLSearchParams): string {
  return `${CUSTOM_API_BASE_URL}?${params.toString()}`;
}
