// src/frontend/app/generate/page.tsx
'use client'

import { useReducer, useEffect, useState } from 'react';
import { Download, Trash } from 'lucide-react';
import BpmnViewer from './BpmnViewer';
import useFlowStore from '../store/flowStore';
import useProjectStore from '../store/projectStore';
import { useModelStore } from '../store/modelStore';
import axios from 'axios';

interface Solution {
  id: string;
  name: string;
  category: string;
  features: string;
}

interface Project {
  id: number;
  customer_name: string;
  issues: string;
  has_flow_flag: boolean;
  bpmn_xml: string;
  solution_requirements: string;
}

interface State {
  currentStep: number;
  customerInfo: string;
  issues: string;
  solutionRequirements: string;
  generatedFlow: string;
  isStepComplete: boolean;
  selectedSolution: string;
  solutionOverview: string;
  solutions: Solution[];
  evaluation: string;
  combination: string;
  output: string;
  loading: boolean;
}

type Action =
  | { type: 'SET_SOLUTIONS'; payload: Solution[] }
  | { type: 'SET_CUSTOMER_INFO'; payload: string }
  | { type: 'SET_ISSUES'; payload: string }
  | { type: 'SET_SOLUTION_REQUIREMENTS'; payload: string }
  | { type: 'SET_GENERATED_FLOW'; payload: string }
  | { type: 'SET_SELECTED_SOLUTION'; payload: string }
  | { type: 'SET_SOLUTION_OVERVIEW'; payload: string }
  | { type: 'SET_EVALUATION'; payload: string }
  | { type: 'SET_COMBINATION'; payload: string }
  | { type: 'SET_OUTPUT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET' };

const initialState: State = {
  currentStep: 1,
  customerInfo: '',
  issues: '',
  solutionRequirements: '',
  generatedFlow: '',
  isStepComplete: false,
  selectedSolution: '',
  solutionOverview: '',
  solutions: [],
  evaluation: '',
  combination: '',
  output: '',
  loading: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SOLUTIONS':
      return { ...state, solutions: action.payload };
    case 'SET_CUSTOMER_INFO':
      return { ...state, customerInfo: action.payload };
    case 'SET_ISSUES':
      return { ...state, issues: action.payload };
    case 'SET_SOLUTION_REQUIREMENTS':
      return { ...state, solutionRequirements: action.payload,
        isStepComplete: !!action.payload || !!state.generatedFlow
      };
    case 'SET_GENERATED_FLOW':
      return { ...state, generatedFlow: action.payload,
        isStepComplete: !!action.payload || !!state.solutionRequirements
      };
    case 'SET_SELECTED_SOLUTION':
      return { ...state, selectedSolution: action.payload };
    case 'SET_SOLUTION_OVERVIEW':
      return { ...state, solutionOverview: action.payload };
    case 'SET_EVALUATION':
      return { ...state, evaluation: action.payload };
    case 'SET_COMBINATION':
      return { ...state, combination: action.payload };
    case 'SET_OUTPUT':
      return { ...state, output: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'NEXT_STEP':
      return { ...state, currentStep: state.currentStep + 1 };
    case 'PREV_STEP':
      return { ...state, currentStep: state.currentStep - 1 };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export default function Generate() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { generatedFlow, setGeneratedFlow, resetFlow } = useFlowStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const { selectedProject, setSelectedProject } = useProjectStore();
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);

  useEffect(() => {
    if (selectedProject) {
      dispatch({ type: 'SET_CUSTOMER_INFO', payload: selectedProject.customer_name });
      dispatch({ type: 'SET_ISSUES', payload: selectedProject.issues });
      dispatch({ type: 'SET_GENERATED_FLOW', payload: selectedProject.bpmn_xml });
      console.log('Loaded Solution Requirements:', selectedProject.solution_requirements);
      dispatch({ type: 'SET_SOLUTION_REQUIREMENTS', payload: selectedProject.solution_requirements || '' });
      setGeneratedFlow(selectedProject.bpmn_xml);
      fetchSolutions();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await axios.get<Project[]>('http://127.0.0.1:8000/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('プロジェクトの取得に失敗しました。');
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchSolutions = async () => {
    try {
      const response = await axios.get<Solution[]>('http://127.0.0.1:8000/api/solutions');
      dispatch({ type: 'SET_SOLUTIONS', payload: response.data });
    } catch (error) {
      console.error('Error fetching solutions:', error);
      alert('ソリューションの取得に失敗しました。');
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    dispatch({ type: 'SET_CUSTOMER_INFO', payload: project.customer_name });
    dispatch({ type: 'SET_ISSUES', payload: project.issues });
    dispatch({ type: 'SET_GENERATED_FLOW', payload: project.bpmn_xml });
    setGeneratedFlow(project.bpmn_xml);
  };

  const handleGenerateRequirements = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const { selectedModel } = useModelStore.getState();
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/ai/generate-requirements', {
        customer_info: state.customerInfo,
        issues: state.issues,
        model: selectedModel.value
      });
      const requirements = response.data.response;
      dispatch({ type: 'SET_SOLUTION_REQUIREMENTS', payload: requirements });
      if (selectedProject) {
        await axios.put(`http://127.0.0.1:8000/api/projects/${selectedProject.id}/requirements`, {
          solution_requirements: requirements,
        });
      }
    } catch (error) {
      console.error('Error generating requirements:', error);
      alert('ソリューション要件の生成に失敗しました。');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleGenerateFlow = async () => {
    const { selectedModel } = useModelStore.getState();
    if (!selectedProject) {
      alert('プロジェクトを選択してください。');
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/ai/generate-flow', { 
        customer_info: state.customerInfo,
        issues: state.issues,
        model: selectedModel.value,
      });
      const cleanedFlow = response.data.flow.trim();
      dispatch({ type: 'SET_GENERATED_FLOW', payload: cleanedFlow });
      setGeneratedFlow(cleanedFlow);
      // バックエンドにフローを保存
      await axios.put(`http://127.0.0.1:8000/api/projects/${selectedProject.id}/flow`, {
        bpmn_xml: cleanedFlow,
      });
      alert('業務フローが生成されました。');
      // プロジェクトのフラグを更新
      fetchProjects();
    } catch (error) {
      console.error('Error generating BPMN:', error);
      alert('BPMNの生成に失敗しました。');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleDeleteFlow = async () => {
    if (!selectedProject) {
      alert('プロジェクトを選択してください。');
      return;
    }
    if (!window.confirm('業務フローを削除してもよろしいですか？')) {
      return; // 確認ダイアログでキャンセルが選択された場合
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await axios.delete(`http://127.0.0.1:8000/api/projects/${selectedProject.id}/flow`);
      dispatch({ type: 'SET_GENERATED_FLOW', payload: '' }); // フロントエンドの状態を更新
      setGeneratedFlow(''); // zustandの状態も更新
      alert('業務フローを削除しました。');
      fetchProjects(); // プロジェクトリストを再取得してUIを更新
    } catch (error) {
      console.error('Error deleting flow:', error);
      alert('業務フローの削除に失敗しました。');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleSolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    dispatch({ type: 'SET_SELECTED_SOLUTION', payload: selectedId });
    const selected = state.solutions.find((solution) => solution.id === selectedId);
    if (selected) {
      dispatch({ type: 'SET_SOLUTION_OVERVIEW', payload: `${selected.name}: ${selected.features}` });
    } else {
      dispatch({ type: 'SET_SOLUTION_OVERVIEW', payload: '' });
    }
  };

  const handleGenerateProposal = async () => {
    const { selectedModel } = useModelStore.getState();
    if (!selectedProject) {
      alert('プロジェクトを選択してください。');
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/proposals', {
        customer_info: state.customerInfo,
        project_info: state.issues,
        solution_id: state.selectedSolution,
        model: selectedModel.value,
      });
      dispatch({ type: 'SET_OUTPUT', payload: response.data.content || 'No output received' });
      dispatch({ type: 'NEXT_STEP' });
      alert('提案が生成されました。');
    } catch (error) {
      console.error('Error generating proposal:', error);
      dispatch({ type: 'SET_OUTPUT', payload: 'Failed to generate the proposal' });
      alert('提案の生成に失敗しました。');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleEvaluateSolutions = async () => {
    const { selectedModel } = useModelStore.getState();
    if (!selectedProject) {
      alert('プロジェクトを選択してください。');
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/ai/evaluate-solutions', {
        evaluation: state.evaluation,
        model: selectedModel.value,
      });
      dispatch({ type: 'SET_COMBINATION', payload: response.data.combination });
      alert('ソリューションが評価されました。');
    } catch (error) {
      console.error('Error evaluating solutions:', error);
      alert('ソリューションの評価に失敗しました。');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleReset = () => {
    dispatch({ type: 'RESET' });
    resetFlow();
    setSelectedProject(null);
    fetchProjects();
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <Step1
            customerInfo={state.customerInfo}
            setCustomerInfo={(val) => dispatch({ type: 'SET_CUSTOMER_INFO', payload: val })}
            issues={state.issues}
            setIssues={(val) => dispatch({ type: 'SET_ISSUES', payload: val })}
            generatedFlow={state.generatedFlow}
            handleGenerateFlow={handleGenerateFlow}
            handleGenerateRequirements={handleGenerateRequirements}
            loading={state.loading}
            nextStep={() => dispatch({ type: 'NEXT_STEP' })}
            isStepComplete={state.isStepComplete}
          />
        );
      case 2:
        return (
          <Step2
            solutions={state.solutions}
            selectedSolution={state.selectedSolution}
            handleSolutionChange={handleSolutionChange}
            solutionOverview={state.solutionOverview}
            nextStep={() => dispatch({ type: 'NEXT_STEP' })}
            prevStep={() => dispatch({ type: 'PREV_STEP' })}
          />
        );
      case 3:
        return (
          <Step3
          evaluation={state.evaluation}
          setEvaluation={(val) => dispatch({ type: 'SET_EVALUATION', payload: val })}
          combination={state.combination}
          setCombination={(val) => dispatch({ type: 'SET_COMBINATION', payload: val })}
          handleEvaluate={handleEvaluateSolutions}
          handleGenerateProposal={handleGenerateProposal}
          loading={state.loading}
          nextStep={() => dispatch({ type: 'NEXT_STEP' })}
          prevStep={() => dispatch({ type: 'PREV_STEP' })}
          />
        );
      case 4:
        return (
          <FinalStep
            output={state.output}
            handleReset={handleReset}
            prevStep={() => dispatch({ type: 'PREV_STEP' })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* タイトルとプロジェクト選択 */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-gray-800">コンサルティングAI</h1>
        {/* 提案書を作成 ボタンを追加 */}
        {selectedProject && state.currentStep >= 1 && ( // final step のみ表示などの条件を追加しても良い
          <button
            onClick={async () => {
              if (!selectedProject) return;
              dispatch({ type: 'SET_LOADING', payload: true });
              try {
                const response = await axios.get(`http://127.0.0.1:8000/api/projects/${selectedProject.id}/proposal`, { // 提案書APIエンドポイントを呼び出す
                  responseType: 'blob',
                });
                const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `project_${selectedProject.id}_proposal.pptx`; // 提案書用のファイル名
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                alert('提案書PowerPointファイルのダウンロードを開始します。');
              } catch (error) {
                console.error('提案書PowerPoint export error:', error);
                alert('提案書PowerPointファイルのエクスポートに失敗しました。');
              } finally {
                dispatch({ type: 'SET_LOADING', payload: false });
              }
            }}
            className="bg-[#173241] hover:bg-[#0F2835] text-white font-bold py-2 px-4 rounded ml-4" // スタイルは調整してください
            disabled={state.loading}
          >
            提案書を作成
          </button>
        )}
      </div>

      {/* プロジェクトが選択されていない場合のUI */}
      {!selectedProject && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg text-gray-700">◀「プロジェクト選択」からプロジェクトを選択してください。</p>
          </div>
        </div>
      )}

      {/* プロジェクトが選択されている場合 */}
      {selectedProject && renderStep()}

      {selectedProject && state.solutionRequirements && (
        <div className="mt-6">
          <div className="flex items-center mb-4">
            <img
              src="/icon.png"
              alt="AIアイコン"
              className="h-10 w-10 rounded-full ml-6 mr-3"
            />
            <div className="bg-[#CB6CE6] bg-opacity-10 text-[#CB6CE6] font-bold px-4 py-2 rounded-lg shadow">
              ソリューション要件の候補は以下です。必要な要件を選択してください。
            </div>
          </div>
          <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow">
            {state.solutionRequirements
              .split('\n')
              .filter(req => req.trim() !== '')
              .map((req, idx) => (
                <div key={idx} className="flex items-center mb-2">
                  <input type="checkbox" id={`requirement-${idx}`} className="mr-2" />
                  <label htmlFor={`requirement-${idx}`} className="text-gray-800">{req}</label>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {selectedProject && state.generatedFlow && (
        <div className="mt-6">
          {/* 吹き出しとアイコン */}
          <div className="flex items-center mb-4">
            <img
              src="/icon.png"
              alt="AIアイコン"
              className="h-10 w-10 rounded-full ml-6 mr-3"
            />
            <div className="bg-[#CB6CE6] bg-opacity-10 text-[#CB6CE6] font-bold px-4 py-2 rounded-lg shadow">
              作成した業務フローは以下です。
            </div>
          </div>

          {/* 業務フロー表示 */}
          <div className="relative"> {/* 相対配置のコンテナを追加 */}
            <BpmnViewer xml={state.generatedFlow} projectId={selectedProject.id.toString()} />
            {/* 削除ボタンを絶対配置 */}
            <button
              onClick={handleDeleteFlow}
              className="absolute top-2 right-2 bg-[#BF4242] hover:bg-[#A53939] text-white font-bold py-2 px-2 rounded-full shadow"
            >
              <Trash size={16} /> {/* Trashアイコン */}
            </button>
            {/* PowerPoint 出力ボタンを削除ボタンの下に追加 */}
            <button
                onClick={async () => {
                    if (!selectedProject) return;
                    dispatch({ type: 'SET_LOADING', payload: true }); // ローディング開始
                    try {
                        const response = await axios.get(`http://127.0.0.1:8000/api/projects/${selectedProject.id}/powerpoint`, {
                            responseType: 'blob', // Blobとしてレスポンスを受け取る
                        });
                        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `project_${selectedProject.id}_flow_objects.pptx`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                        alert('PowerPointファイルのダウンロードを開始します。');
                    } catch (error) {
                        console.error('PowerPoint export error:', error);
                        alert('PowerPointファイルのエクスポートに失敗しました。');
                    } finally {
                        dispatch({ type: 'SET_LOADING', payload: false }); // ローディング終了
                    }
                }}
                className="absolute top-12 right-2 bg-[#173241] hover:bg-[#0F2835] text-white font-bold py-2 px-2 rounded-full shadow"
                disabled={state.loading} // ローディング中はボタンをdisabledにする
            >
                {state.loading ? (
                    '生成中...'
                ) : (
                    <>
                        <Download size={16} /> {/* ダウンロードアイコン */}
                    </>
                )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 各ステップのコンポーネント
interface Step1Props {
  customerInfo: string;
  setCustomerInfo: (val: string) => void;
  issues: string;
  setIssues: (val: string) => void;
  generatedFlow: string;
  handleGenerateFlow: () => void;
  handleGenerateRequirements: () => void;
  loading: boolean;
  nextStep: () => void;
}

const Step1 = ({
  customerInfo,
  setCustomerInfo,
  issues,
  setIssues,
  generatedFlow,
  handleGenerateFlow,
  handleGenerateRequirements,
  loading,
  nextStep,
  isStepComplete,
}: Step1Props) => {
  useEffect(() => {
    // 初期テンプレートを設定
    setCustomerInfo('倉庫会社');
    setIssues('パレットの規格の違いや人手不足等もあり、荷下ろしに時間がかかっているため、物流のボトルネックになっている。そのため、荷下ろしの待機列が発生し、時間短縮のために作業にドライバーが駆り出されることになり、負担がかかっている。');
  }, []); // 依存配列に setter を入れる

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">ステップ1: 課題の明確化</h2>
      <div className="flex items-center mt-6">
        <img
          src="/icon.png"
          alt="AIアイコン"
          className="h-10 w-10 rounded-full mr-3 mb-4"
        />
        <div className="bg-[#CB6CE6] bg-opacity-10 text-[#CB6CE6] font-bold px-4 py-2 rounded-lg shadow mb-4">
          課題に関する情報を教えてください。
        </div>
      </div>
      <textarea
        className="w-full p-2 border rounded mb-4"
        placeholder="組織・顧客情報を入力してください"
        value={customerInfo}
        onChange={(e) => setCustomerInfo(e.target.value)}
        rows={1}
      />
      <textarea
        className="w-full p-2 border rounded mb-2"
        placeholder="課題を入力してください"
        value={issues}
        onChange={(e) => setIssues(e.target.value)}
        rows={3}
      />
      <div className="flex items-center mt-2">
        <div className="flex justify-center flex-1">
          <button
            onClick={handleGenerateFlow}
            className="px-4 py-2 bg-[#CB6CE6] text-white font-bold rounded hover:bg-[#A94CCB] disabled:opacity-50"
            disabled={!customerInfo || !issues || loading}
          >
            {loading ? '生成中...' : '業務フロー生成'}
          </button>
          <button
            onClick={handleGenerateRequirements}
            className="px-4 py-2 bg-[#CB6CE6] text-white font-bold rounded hover:bg-[#A94CCB] ml-10 disabled:opacity-50"
            disabled={!customerInfo || !issues || loading}
          >
            {loading ? '生成中...' : 'ソリューション要件生成'}
          </button>
        </div>
        <div className="flex justify-end">
          <button
            onClick={nextStep}
            className="px-4 py-2 bg-[#173241] text-white font-bold rounded hover:bg-[#0F2835] disabled:opacity-50"
            disabled={!isStepComplete}
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
};

interface Step2Props {
  solutions: Solution[];
  selectedSolution: string;
  handleSolutionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  solutionOverview: string;
  nextStep: () => void;
  prevStep: () => void;
}

const Step2 = ({
  solutions,
  selectedSolution,
  handleSolutionChange,
  solutionOverview,
  nextStep,
  prevStep,
}: Step2Props) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h2 className="text-xl font-semibold mb-4">ステップ2: ソリューションの選択</h2>
    <div className="mb-4">
      <select
        className="w-full p-2 border rounded mb-2"
        value={selectedSolution}
        onChange={handleSolutionChange}
      >
        <option value="">Select a solution</option>
        {solutions.map((solution) => (
          <option key={solution.id} value={solution.id}>
            {solution.name}
          </option>
        ))}
      </select>
    </div>
    {solutionOverview && (
      <textarea
        className="w-full p-2 border rounded mb-4"
        value={solutionOverview}
        readOnly
        rows={3}
      />
    )}
    <div className="flex justify-between">
      <button
        onClick={prevStep}
        className="px-4 py-2 bg-gray-300 rounded flex items-center"
      >
        戻る
      </button>
      <button
        onClick={nextStep}
        className="px-4 py-2 bg-[#173241] text-white font-bold rounded"
        disabled={!selectedSolution}
      >
        次へ
      </button>
    </div>
  </div>
);

interface Step3Props {
  evaluation: string;
  setEvaluation: (val: string) => void;
  combination: string;
  setCombination: (val: string) => void;
  handleEvaluate: () => void;
  handleGenerateProposal: () => void;
  loading: boolean;
  nextStep: () => void;
  prevStep: () => void;
}

const Step3 = ({
  evaluation,
  setEvaluation,
  combination,
  setCombination,
  handleEvaluate,
  handleGenerateProposal,
  loading,
  nextStep,
  prevStep,
}: Step3Props) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h2 className="text-xl font-semibold mb-4">ステップ3: ソリューションの評価と組み合わせ</h2>
    <div className="space-y-4">
      <textarea
        className="w-full p-2 border rounded"
        placeholder="ソリューションの評価基準を入力してください"
        value={evaluation}
        onChange={(e) => setEvaluation(e.target.value)}
        rows={4}
      />
      <button
        onClick={handleEvaluate}
        className="px-4 py-2 bg-green-500 text-white rounded"
        disabled={!evaluation || loading}
      >
        {loading ? '評価中...' : 'AIに評価を依頼'}
      </button>
      {combination && (
        <textarea
          className="w-full p-2 border rounded"
          value={combination}
          readOnly
          rows={3}
        />
      )}
    </div>
    <div className="flex justify-between mt-4">
      <button
        onClick={prevStep}
        className="px-4 py-2 bg-gray-300 rounded flex items-center"
      >
        戻る
      </button>
      <button
        onClick={handleGenerateProposal}
        className="px-4 py-2 bg-[#BF4242] text-white font-bold rounded"
        disabled={!combination || loading}
      >
        {loading ? '生成中...' : '提案を生成'}
      </button>
    </div>
  </div>
);

interface FinalStepProps {
  output: string;
  handleReset: () => void;
  prevStep: () => void;
}

const FinalStep = ({
  output,
  handleReset,
  prevStep,
}: FinalStepProps) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h2 className="text-xl font-semibold mb-4">生成された提案</h2>
    <div className="p-4 bg-gray-100 rounded h-64 overflow-y-auto">
      {output}
    </div>
    <div className="flex justify-between mt-4">
      <button
        onClick={prevStep}
        className="px-4 py-2 bg-gray-300 rounded flex items-center"
      >
        戻る
      </button>
      <button
        onClick={handleReset}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        リセット
      </button>
    </div>
  </div>
);
