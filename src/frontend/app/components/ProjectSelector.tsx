// src/frontend/app/components/ProjectSelector.tsx
'use client'

import React, { useEffect } from 'react';
import useProjectStore from '../store/projectStore';
import { usePathname } from 'next/navigation';

export default function ProjectSelector() {
  const { projects, selectedProject, setSelectedProject } = useProjectStore();
  const pathname = usePathname();

  const handleProjectSelect = (projectId: number) => {
    const project = projects.find((p) => p.id === projectId)
    setSelectedProject(project || null)
  }

  const archivedProjects = projects.filter(project => {
    if (pathname === '/generate/sales-material' || pathname === '/project-management') {
      return !project.is_archived && project.category === 'プロジェクト'; // コンサルティングAI または プロジェクトAI ページ
    } else {
      return !project.is_archived; // その他のページ
    }
  });

  useEffect(() => {
    if (
      (pathname === '/generate' || pathname === '/project-management') &&
      selectedProject &&
      selectedProject.category === 'ナレッジベース'
    ) {
      setSelectedProject(null);
    }
  }, [pathname, selectedProject, setSelectedProject]);

  return (
    <div className="ml-auto flex items-center space-x-2">
      <select
        className="px-3 py-2 border rounded"
        onChange={(e) => handleProjectSelect(Number(e.target.value))}
        value={selectedProject?.id || ''}
      >
        <option value="" disabled={archivedProjects.length === 0}>
          {archivedProjects.length > 0 ? 'プロジェクトを選択してください' : 'プロジェクトがありません'}
        </option>
        {archivedProjects.length > 0 && (
          archivedProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.customer_name}
            </option>
          ))
        )}
      </select>
    </div>
  );
}