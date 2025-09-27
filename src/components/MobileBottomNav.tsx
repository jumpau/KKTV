/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import React, { useState, useEffect } from 'react';
import { Film, Home, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileBottomNavProps {
  /**
   * 主动指定当前激活的路径。当未提供时，自动使用 usePathname() 获取的路径。
   */
  activePath?: string;
}

const MobileBottomNav = ({ activePath }: MobileBottomNavProps) => {
  const pathname = usePathname();

  // 当前激活路径：优先使用传入的 activePath，否则回退到浏览器地址
  const currentActive = activePath ?? pathname;

  const [navItems, setNavItems] = useState([
    { icon: Home, label: '首页', href: '/' },
    { icon: Search, label: '搜索', href: '/search' },
  ]);

  // 获取线路数据
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch('/api/sources');
        if (response.ok) {
          const sources = await response.json();
          const sourceItems = sources.map((source: any) => ({
            icon: Film,
            label: source.name,
            href: `/sources/${source.id}`,
          }));
          
          setNavItems([
            { icon: Home, label: '首页', href: '/' },
            { icon: Search, label: '搜索', href: '/search' },
            ...sourceItems,
          ]);
        }
      } catch (error) {
        console.error('获取线路失败:', error);
      }
    };

    fetchSources();
  }, []);

  const isActive = (href: string) => {
    // 解码URL以进行正确的比较
    const decodedActive = decodeURIComponent(currentActive);
    const decodedItemHref = decodeURIComponent(href);

    // 精确匹配
    if (decodedActive === decodedItemHref) {
      return true;
    }

    // 对于线路页面，检查是否在该线路的任何子页面
    if (href.startsWith('/sources/') && decodedActive.startsWith(href)) {
      return true;
    }

    return false;
  };

  return (
    <nav
      className='md:hidden fixed left-0 right-0 z-[600] bg-white/90 backdrop-blur-xl border-t border-gray-200/50 overflow-hidden dark:bg-gray-900/80 dark:border-gray-700/50'
      style={{
        /* 紧贴视口底部，同时在内部留出安全区高度 */
        bottom: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
        minHeight: 'calc(3.5rem + env(safe-area-inset-bottom))',
      }}
    >
      <ul className='flex items-center overflow-x-auto scrollbar-hide'>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <li
              key={item.href}
              className='flex-shrink-0'
              style={{ 
                width: navItems.length <= 3 ? '33.33vw' : 
                       navItems.length <= 5 ? '20vw' : '15vw', 
                minWidth: navItems.length <= 3 ? '33.33vw' : 
                          navItems.length <= 5 ? '20vw' : '15vw' 
              }}
            >
              <Link
                href={item.href}
                className='flex flex-col items-center justify-center w-full h-14 gap-1 text-xs px-1'
              >
                <item.icon
                  className={`h-6 w-6 ${
                    active
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                />
                <span
                  className={`truncate text-center ${
                    active
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                  title={item.label}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
