// src/frontend/app/page.tsx
'use client'

import { useEffect, useState } from 'react';
import { Flag, Edit2 } from 'lucide-react';

interface Task {
  project: string;
  task: string;
  status: string;
}

export default function Dashboard() {
  const proposals = [
    { id: 1, title: 'Proposal 1', customer: 'Customer A', project: 'Project X', flagged: true },
    { id: 2, title: 'Proposal 2', customer: 'Customer B', project: 'Project Y', flagged: true },
    { id: 3, title: 'Proposal 3', customer: 'Customer C', project: 'Project Z', flagged: false },
  ];

  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/project-tasks');
        if (!response.ok) {
          throw new Error('Failed to fetch project tasks');
        }
        const data = await response.json();
        setProjectTasks(data);
      } catch (error) {
        console.error('Error fetching project tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Proposals Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {proposals.map((proposal) => (
              <tr key={proposal.id}>
                <td className="px-6 py-4 whitespace-nowrap">{proposal.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">{proposal.customer}</td>
                <td className="px-6 py-4 whitespace-nowrap">{proposal.project}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button className="text-blue-600 hover:text-blue-900 mr-2">
                    <Flag className="h-5 w-5" />
                  </button>
                  <button className="text-green-600 hover:text-green-900">
                    <Edit2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Project-Task Table */}
      <h2 className="text-xl font-bold mb-4">Project - Task Table</h2>
      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projectTasks.map((task, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{task.project}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{task.task}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{task.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
