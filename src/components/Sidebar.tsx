/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { Film, Home, Menu, Search } from 'lucide-react';

import { useSite } from './SiteProvider';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

const SiteLogo = () => {
  const { siteName } = useSite();

  return (
    <Link href="/" className="inline-block">
      <div className="flex items-center justify-center h-12 w-full">
        <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
          {siteName}
        </span>
      </div>
    </Link>
  );
};

interface SidebarProps {
  onToggle?: (isCollapsed: boolean) => void;
  activePath?: string;
}

declare global {
  interface Window {
    __sidebarCollapsed?: boolean;
  }
}

const Sidebar = ({ onToggle, activePath = '/' }: SidebarProps) => {
  const pathname = usePathname();

  // 若同一次 SPA 会话中已经读取过折叠状态，则直接复用，避免闪烁
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.__sidebarCollapsed === 'boolean'
    ) {
      return window.__sidebarCollapsed;
    }
    return false; // 默认展开
  });

  const [active, setActive] = useState(activePath);

  // 保存折叠状态到内存中，避免页面跳转时重置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__sidebarCollapsed = isCollapsed;
    }
  }, [isCollapsed]);

  // 计算当前激活状态
  useEffect(() => {
    if (activePath) {
      setActive(activePath);
    } else {
      // 否则使用当前路径
      setActive(pathname);
    }
  }, [activePath, pathname]);

  const handleToggle = useCallback(() => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (typeof window !== 'undefined') {
      window.__sidebarCollapsed = newState;
    }
    onToggle?.(newState);
  }, [isCollapsed, onToggle]);

  const contextValue: SidebarContextType = {
    isCollapsed,
    toggleCollapsed: handleToggle,
  };

  const [menuItems, setMenuItems] = useState([
    {
      icon: Home,
      label: '首页',
      href: '/',
    },
    {
      icon: Search,
      label: '搜索',
      href: '/search',
    },
  ]);

  // 动态加载线路信息
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch('/api/sources');
        const result = await response.json();
        
        // 支持多种API响应格式
        let sources = [];
        if (Array.isArray(result)) {
          sources = result;
        } else if (result.code === 200 && result.data) {
          sources = result.data;
        } else if (result.sources) {
          sources = result.sources;
        }

        if (sources.length > 0) {
          const sourceItems = sources.map((source: any) => ({
            icon: Film,
            label: source.name,
            href: `/sources/${source.id}`,
          }));
          
          setMenuItems(prevItems => [
            ...prevItems.slice(0, 2), // 保留首页和搜索
            ...sourceItems
          ]);
        }
      } catch (error) {
        // 获取线路失败，保持默认菜单
      }
    };

    fetchSources();
  }, []);

  return (
    <SidebarContext.Provider value={contextValue}>
      {/* 在移动端隐藏侧边栏 */}
      <div className='hidden md:flex'>
        <aside
          data-sidebar
          className={`fixed top-0 left-0 h-screen bg-white/40 backdrop-blur-xl transition-all duration-300 border-r border-gray-200/50 z-10 shadow-lg dark:bg-gray-900/70 dark:border-gray-700/50 ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <div className='flex h-full flex-col'>
            {/* Header 区域 */}
            <div className='relative h-16'>
              <div
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                  isCollapsed ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <div className='w-[calc(100%-4rem)] flex justify-center'>
                  <SiteLogo />
                </div>
              </div>
              <button
                onClick={handleToggle}
                className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100/30 transition-colors duration-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/30 ${
                  isCollapsed ? 'left-4' : 'right-2'
                }`}
              >
                <Menu className='h-5 w-5' />
              </button>
            </div>

            {/* Navigation 区域 */}
            <nav className='px-2 mt-4 space-y-1'>
              <div className='space-y-1'>
                {menuItems.map((item) => {
                  const decodedActive = decodeURIComponent(active);
                  const decodedItemHref = decodeURIComponent(item.href);
                  
                  const isActive =
                    decodedActive === decodedItemHref ||
                    (decodedActive.startsWith('/sources') &&
                      item.href === '/sources');
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setActive(item.href)}
                      data-active={isActive}
                      className={`group flex items-center rounded-lg px-2 py-2 pl-4 text-sm text-gray-700 hover:bg-gray-100/30 hover:text-green-600 data-[active=true]:bg-green-500/20 data-[active=true]:text-green-700 transition-colors duration-200 min-h-[40px] dark:text-gray-300 dark:hover:text-green-400 dark:data-[active=true]:bg-green-500/10 dark:data-[active=true]:text-green-400 ${
                        isCollapsed ? 'w-full max-w-none mx-0' : 'mx-0'
                      } gap-3 justify-start`}
                    >
                      <div className='w-4 h-4 flex items-center justify-center'>
                        <Icon className='h-4 w-4 text-gray-500 group-hover:text-green-600 data-[active=true]:text-green-700 dark:text-gray-400 dark:group-hover:text-green-400 dark:data-[active=true]:text-green-400' />
                      </div>
                      {!isCollapsed && (
                        <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </aside>
        <div
          className={`transition-all duration-300 sidebar-offset ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        ></div>
      </div>
    </SidebarContext.Provider>
  );
};

export default Sidebar;
