// frontend/app/generate/page.tsx
'use client'

import Link from 'next/link';
import Image from 'next/image';
import ReactDOM from 'react-dom/client';
import { Presentation } from 'lucide-react';
import { useEffect } from 'react';

export default function GeneratePage() {
  useEffect(() => {
    document.querySelector('.page-title')!.textContent = 'スライド作成AI';
    const iconContainer = document.querySelector('.page-icon')!;
    iconContainer.innerHTML = '';
    const icon = document.createElement('div');
    const root = ReactDOM.createRoot(icon);
    root.render(<Presentation className="h-5 w-5" />);
    iconContainer.appendChild(icon);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-l font-bold mb-4">作成する資料を選択してください</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* カード形式の選択肢をここに追加します */}
        <Link href="/generate/sales-material" className="block p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:bg-gray-100 flex flex-col">
          <div className="mb-4">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 text-left">提案資料</h5>
            <p className="font-normal text-gray-700 text-left">顧客への提案に使用する営業資料を作成します。</p>
          </div>
          <div className="flex justify-center">
            <Image
              src="提案資料テンプレ_イメージ.png"
              alt="提案資料テンプレ"
              width={500}
              height={500}
            />
          </div>
        </Link>
        <Link href="/generate" className="block p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:bg-gray-100">
          <div className="mb-4">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">定例MTG資料</h5>
            <p className="font-normal text-gray-700">顧客との定例MTGで使用する資料を作成します。</p>
          </div>
        </Link>
      </div>
    </div>
  );
}