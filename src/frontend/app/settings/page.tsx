// src/frontend/app/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Upload, Edit2, Trash2, Search } from 'lucide-react'
import BpmnViewer from '../generate/BpmnViewer';
import useFlowStore from '../store/flowStore';

export default function Settings() {
  const { generatedFlow, setGeneratedFlow } = useFlowStore();
  const [uploadProgress, setUploadProgress] = useState(0)
  const [solutions, setSolutions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  // バックエンドから Solutions を取得
  useEffect(() => {
    const fetchSolutions = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/solutions')
        if (!response.ok) throw new Error('Failed to fetch solutions')
        const data = await response.json()
        setSolutions(data)
      } catch (error) {
        console.error('Error fetching solutions:', error)
        alert('Failed to load solutions.')
      }
    }
    fetchSolutions()
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        setUploadProgress(progress)
        if (progress >= 100) {
          clearInterval(interval)
          setTimeout(() => setUploadProgress(0), 1000)
        }
      }, 500)
    }
  }

  const handleEdit = async (id: string) => {
    const solution = solutions.find((s) => s.id === id)
    if (!solution) return
    const updatedName = prompt('Edit Solution Name:', solution.name)
    if (updatedName) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/solutions/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...solution, name: updatedName }),
        })
        if (!response.ok) throw new Error('Failed to update solution')
        const updatedSolution = await response.json()
        setSolutions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...updatedSolution } : s))
        )
      } catch (error) {
        console.error('Error updating solution:', error)
        alert('Failed to update solution.')
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this solution?')) return
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/solutions/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete solution')
      setSolutions((prev) => prev.filter((s) => s.id !== id))
    } catch (error) {
      console.error('Error deleting solution:', error)
      alert('Failed to delete solution.')
    }
  }

  const filteredSolutions = solutions.filter((solution) =>
    solution.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {generatedFlow ? (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">保存された業務フロー図</h2>
          <BpmnViewer xml={generatedFlow} />
        </div>
      ) : (
        <p className="text-gray-500">まだ生成されたフローはありません。</p>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Upload Solution Data</h2>
        <div className="flex items-center space-x-4">
          <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded flex items-center">
            <Upload className="mr-2" />
            Choose File
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv,.xlsx" />
          </label>
          <span>Supported formats: CSV, Excel</span>
        </div>
        {uploadProgress > 0 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Solution Database</h2>
        <div className="mb-4 flex items-center">
          <Search className="absolute ml-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search solutions..."
            className="pl-10 p-2 border rounded w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Features</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSolutions.map((solution) => (
              <tr key={solution.id}>
                <td className="px-6 py-4 whitespace-nowrap">{solution.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{solution.category}</td>
                <td className="px-6 py-4 whitespace-nowrap">{solution.features}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => handleEdit(solution.id)} className="text-blue-600 hover:text-blue-900 mr-2">
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleDelete(solution.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
