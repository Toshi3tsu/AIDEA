// src/frontend/app/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Home, CalendarIcon } from 'lucide-react';
import ReactDOM from 'react-dom/client';
import ScheduleComponent from './components/ScheduleComponent';

interface Project {
  id: number;
  customer_name: string;
  issues: string;
  stage: string;
  category: string;
}

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string | null;
}

interface NewsKeyword {
  id: number;
  keyword: string;
  user_id: string;
}

export default function Dashboard() {
  useEffect(() => {
    document.querySelector('.page-title')!.textContent = 'ホーム';
    const iconContainer = document.querySelector('.page-icon')!;
    iconContainer.innerHTML = '';
    const icon = document.createElement('div');
    const root = ReactDOM.createRoot(icon); // root を作成
    root.render(<Home className="h-5 w-5" />); // root の render メソッドを使用
    iconContainer.appendChild(icon);
  }, []);

  const [projects, setProjects] = useState<Project[]>([]);
  const [allNewsList, setAllNewsList] = useState<NewsArticle[][]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  let lastFetchedTime = 0; // lastFetchedTime を変数として定義
  const NEWS_PER_COLUMN = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentNewsList, setCurrentNewsList] = useState<NewsArticle[]>([]);
  const [selectedKeywordIndex, setSelectedKeywordIndex] = useState(0);
  const [newsKeywords, setNewsKeywords] = useState<NewsKeyword[]>([]);


  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    try {
      const response = await axios.get<NewsKeyword[]>('http://127.0.0.1:8000/api/news/keywords');
      setNewsKeywords(response.data);
    } catch (error) {
      console.error('Error fetching news keywords:', error);
      alert('ニュースキーワードの取得に失敗しました。');
      setNewsKeywords([{ id: 1, keyword: 'AI', user_id: 'user_888' }, { id: 2, keyword: 'DX', user_id: 'user_888' }]); // デフォルトキーワードを設定
    }
  };

    useEffect(() => {
        fetchProjects();
        fetchNewsForKeywords();
      }, [newsKeywords]);

    useEffect(() => {
        if (allNewsList.length > 0 && newsKeywords.length > 0) {
          applyPagination(allNewsList[selectedKeywordIndex] || []);
        }
      }, [allNewsList, currentPage, selectedKeywordIndex, newsKeywords]);

  const applyPagination = (newsForKeyword: NewsArticle[]) => {
      const startIndex = (currentPage - 1) * NEWS_PER_COLUMN * 3;
      const endIndex = startIndex + NEWS_PER_COLUMN * 3;
      const paginatedNews = newsForKeyword.slice(startIndex, endIndex);
      setCurrentNewsList(paginatedNews);
      setTotalPages(Math.ceil(newsForKeyword.length / (NEWS_PER_COLUMN * 3)) || 1);
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get<Project[]>('http://127.0.0.1:8000/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('プロジェクトの取得に失敗しました。');
    }
  };

  const fetchNewsForKeywords = async () => {
    setLoadingNews(true);
    const fetchedNews: NewsArticle[][] = [];

      for (const keywordObj of newsKeywords) {
        const keyword = keywordObj.keyword;
        try {
          const response = await axios.get<NewsArticle[]>('http://127.0.0.1:8000/api/news/news', {
                params: { keyword: keyword }
          });

        const sortedNews = response.data.sort((a, b) => {
            if (!a.pubDate || !b.pubDate) return 0;
            return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
        });
        fetchedNews.push(sortedNews);

    } catch (error) {
        console.error(`Error fetching news for keyword ${keyword}:`, error);
        alert(`キーワード「${keyword}」のニュース取得に失敗しました。`);
        fetchedNews.push([]);
    }

    }
    setAllNewsList(fetchedNews);
    setCurrentPage(1);
    lastFetchedTime = Date.now();
    setLoadingNews(false);

};

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

    const handleKeywordTabChange = (index: number) => {
        setSelectedKeywordIndex(index);
        setCurrentPage(1);
    };


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* プロジェクトスケジュールセクション */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">プロジェクトスケジュール</h2>
      <section className="mb-8">
        <ScheduleComponent />
      </section>

      {/* Googleニュースセクション */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Googleニュース</h2>

        {/* キーワードタブ */}
        <div className="mb-4">
          <nav className="flex space-x-4">
            {newsKeywords.map((keywordObj, index) => (
              <button
                key={keywordObj.id}
                className={`px-4 py-2 rounded ${selectedKeywordIndex === index ? 'bg-[#173241] text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => handleKeywordTabChange(index)}
              >
                {keywordObj.keyword}
              </button>
            ))}
          </nav>
        </div>


        {loadingNews ? (
          <p>ニュース読み込み中...</p>
        ) : (
          <div className="bg-white shadow rounded-lg p-4">
            <div className="md:grid md:grid-cols-3 md:gap-4">
              <ul className="space-y-2">
                {currentNewsList.slice(0, NEWS_PER_COLUMN).map((article, articleIndex) => (
                  <li key={articleIndex} className="mb-2 pb-2 border-b last:border-b-0">
                    <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                      {article.title}
                    </a>
                    {article.pubDate && (
                      <p className="text-gray-500 text-xs">
                        {new Date(article.pubDate).toLocaleString()}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <ul className="space-y-2">
                {currentNewsList.slice(NEWS_PER_COLUMN, NEWS_PER_COLUMN * 2).map((article, articleIndex) => (
                  <li key={articleIndex} className="mb-2 pb-2 border-b last:border-b-0">
                    <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                      {article.title}
                    </a>
                    {article.pubDate && (
                      <p className="text-gray-500 text-xs">
                        {new Date(article.pubDate).toLocaleString()}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <ul className="space-y-2">
                {currentNewsList.slice(NEWS_PER_COLUMN * 2, NEWS_PER_COLUMN * 3).map((article, articleIndex) => (
                  <li key={articleIndex} className="mb-2 pb-2 border-b last:border-b-0">
                    <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                      {article.title}
                    </a>
                    {article.pubDate && (
                      <p className="text-gray-500 text-xs">
                        {new Date(article.pubDate).toLocaleString()}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {currentNewsList.length === 0 && (
              <p className="text-gray-500">
                {newsKeywords[selectedKeywordIndex]?.keyword}に関するニュースはありません
              </p>
            )}
          </div>
        )}
      </section>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center mb-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50"
          >
            前へ
          </button>
          <span className="mx-4 py-2">{currentPage} / {totalPages} ページ</span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
}