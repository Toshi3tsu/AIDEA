// src/frontend/app/components/ScheduleComponent.tsx
"use client"

import { useState, useEffect } from "react"
import useProjectStore from "../store/projectStore"
import axios from "axios"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

interface Milestone {
  date: string
  description: string
}

interface Project {
  id: number
  customer_name: string
  schedule: string
}

const formatDate = (date: Date | null): string => {
  if (!date) return ""
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null
  return new Date(dateString)
}

export default function ScheduleComponent() {
  const { selectedProject, projects, setProjects } = useProjectStore()
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [newMilestoneDate, setNewMilestoneDate] = useState<Date | null>(null)
  const [newMilestoneDescription, setNewMilestoneDescription] = useState<string>("")
  // The JSX variable was undeclared.  It's not actually used in the component, so removing the state variable.
  //const [scheduleBar, setScheduleBar] = useState<JSX.Element | null>(null);

  useEffect(() => {
    if (selectedProject) {
      try {
        const parsedSchedule = JSON.parse(selectedProject.schedule || "[]")
        setMilestones(parsedSchedule)
      } catch (e) {
        console.error("Failed to parse schedule JSON", e)
        setMilestones([])
      }
    } else {
      // Removed setting scheduleBar to null as it's not used.
    }
  }, [selectedProject])

  const handleNewMilestoneDateChange = (date: Date | null) => {
    setNewMilestoneDate(date)
  }

  const handleNewMilestoneDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMilestoneDescription(e.target.value)
  }

  const handleAddMilestone = () => {
    if (!newMilestoneDate || !newMilestoneDescription) {
      alert("日付と内容を入力してください。")
      return
    }
    const newMilestone: Milestone = {
      date: formatDate(newMilestoneDate),
      description: newMilestoneDescription,
    }
    setMilestones([...milestones, newMilestone])
    setNewMilestoneDate(null)
    setNewMilestoneDescription("")
  }

  const handleScheduleSave = async () => {
    if (!selectedProject) return

    const scheduleData = JSON.stringify(milestones)

    try {
      await axios.put(`http://127.0.0.1:8000/api/projects/${selectedProject.id}`, { schedule: scheduleData })
      alert("プロジェクトスケジュールが更新されました。")
      const updatedProjects = projects.map((p) => (p.id === selectedProject.id ? { ...p, schedule: scheduleData } : p))
      setProjects(updatedProjects)
    } catch (error) {
      console.error("Error updating project schedule:", error)
      alert("プロジェクトスケジュールの更新に失敗しました。")
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-4">
      {selectedProject ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">{selectedProject.customer_name}</h3>

          <div className="mb-4 flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-2">
            {/* カレンダー */}
            <div className="flex-[0.3]">
              <label htmlFor="milestoneDate" className="block text-gray-700 text-sm font-bold mb-2">
                マイルストーン日付
              </label>
              <DatePicker
                id="milestoneDate"
                selected={newMilestoneDate}
                onChange={(date: Date | null) => handleNewMilestoneDateChange(date)}
                dateFormat="yyyy-MM-dd"
                placeholderText="日付を選択してください"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            {/* マイルストーン内容入力 */}
            <div className="flex-[0.9]">
              <label htmlFor="milestoneDescription" className="block text-gray-700 text-sm font-bold mb-2">
                マイルストーン内容
              </label>
              <input
                type="text"
                id="milestoneDescription"
                placeholder="マイルストーン内容を入力してください"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newMilestoneDescription}
                onChange={handleNewMilestoneDescriptionChange}
              />
            </div>

            {/* マイルストーン追加ボタン */}
            <div className="flex-none">
              <button
                onClick={handleAddMilestone}
                className="w-full md:w-auto px-4 py-2 bg-[#173241] text-white font-semibold rounded hover:bg-[#0F2835] focus:outline-none focus:shadow-outline"
              >
                マイルストーンを追加
              </button>
            </div>
          </div>

          {/* マイルストーンリスト */}
          <div className="mb-4">
            <h4 className="text-md font-semibold text-gray-700 mb-2">登録済みマイルストーン</h4>
            <ul>
              {milestones.map((milestone, index) => (
                <li key={index} className="mb-2 p-2 border rounded flex items-baseline">
                  <span className="font-semibold mr-2">{milestone.date}</span>
                  {milestone.description}
                </li>
              ))}
              {milestones.length === 0 && <p className="text-gray-500">マイルストーンはまだ登録されていません。</p>}
            </ul>
          </div>

          {/* スケジュール保存ボタン */}
          <div>
            <button
              onClick={handleScheduleSave}
              className="px-4 py-2 bg-[#173241] text-white font-semibold rounded hover:bg-[#0F2835] focus:outline-none focus:shadow-outline"
            >
              スケジュールを保存
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-500">プロジェクトを選択してください</p>
      )}
    </div>
  )
}