// src/frontend/app/generate/[projectId]/page.tsx
'use client'

import { useReducer, useEffect } from 'react';
import { useParams } from 'next/navigation';
import BpmnViewer from '../BpmnViewer';
import useFlowStore from '../../store/flowStore';
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
}

interface State {
  currentStep: number;
  customerInfo: string;
  issues: string;
  generatedFlow: string;
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
  generatedFlow: '',
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
    case 'SET_GENERATED_FLOW':
      return { ...state, generatedFlow: action.payload };
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
  const { projectId } = useParams();
  const { setGeneratedFlow } = useFlowStore();

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails(projectId);
      fetchSolutions();
    }
  }, [projectId]);

  const fetchProjectDetails = async (id: string) => {
    try {
      const response = await axios.get<Project>(`http://127.0.0.1:8000/api/projects`);
      const project = response.data.find((p) => p.id === parseInt(id));
      if (project) {
        dispatch({ type: 'SET_CUSTOMER_INFO', payload: project.customer_name });
        dispatch({ type: 'SET_ISSUES', payload: project.issues });
        dispatch({ type: 'SET_GENERATED_FLOW', payload: project.bpmn_xml });
        setGeneratedFlow(project.bpmn_xml);
      } else {
        alert('プロジェクトが見つかりません。');
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      alert('プロジェクトの詳細取得に失敗しました。');
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

  const setSolutions = (solutions: Solution[]) => {
    dispatch({ type: 'SET_SOLUTIONS', payload: solutions });
  };

  const handleGenerateFlow = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/ai/generate-flow', { 
        customer_info: state.customerInfo,
        issues: state.issues,
      });
      const cleanedFlow = response.data.flow.trim();
      dispatch({ type: 'SET_GENERATED_FLOW', payload: cleanedFlow });
      setGeneratedFlow(cleanedFlow);
      // バックエンドにフローを保存
      await axios.put(`http://127.0.0.1:8000/api/projects/${projectId}/flow`, {
        bpmn_xml: cleanedFlow,
      });
      alert('業務フローが生成されました。');
    } catch (error) {
      console.error('Error generating BPMN:', error);
      alert('BPMNの生成に失敗しました。');
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
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/proposals', {
        customer_info: state.customerInfo,
        project_info: state.issues,
        solution_id: state.selectedSolution,
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
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/ai/evaluate-solutions', {
        evaluation: state.evaluation,
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
    useFlowStore.getState().resetFlow();
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
            handleGenerateFlow={handleGenerateFlow}
            loading={state.loading}
            nextStep={() => dispatch({ type: 'NEXT_STEP' })}
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
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">業務フロー生成</h1>

      {/* プロジェクト選択ドロップダウン */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-2">プロジェクト選択:</label>
        <select
          value={selectedProjectId ?? ''}
          onChange={handleProjectChange}
          className="w-full p-2 border rounded"
        >
          <option value="">プロジェクトを選択してください</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.customer_name} - {project.issues.substring(0, 30)}...
            </option>
          ))}
        </select>
      </div>

      {/* ステップフォーム */}
      {selectedProjectId && renderStep()}

      {/* 業務フロー表示 */}
      {state.generatedFlow && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">生成された業務フロー図</h2>
          <BpmnViewer xml={state.generatedFlow} projectId={selectedProjectId} />
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
  handleGenerateFlow: () => void;
  loading: boolean;
  nextStep: () => void;
}

const Step1 = ({
  customerInfo,
  setCustomerInfo,
  issues,
  setIssues,
  handleGenerateFlow,
  loading,
  nextStep,
}: Step1Props) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">ステップ1: 顧客情報と課題の入力</h2>
      <textarea
        className="w-full p-2 border rounded mb-4"
        placeholder="顧客情報を入力してください"
        value={customerInfo}
        onChange={(e) => setCustomerInfo(e.target.value)}
        rows={2}
      />
      <textarea
        className="w-full p-2 border rounded mb-4"
        placeholder="課題を入力してください"
        value={issues}
        onChange={(e) => setIssues(e.target.value)}
        rows={4}
      />
      <button
        onClick={handleGenerateFlow}
        className="px-4 py-2 bg-blue-500 text-white rounded"
        disabled={!customerInfo || !issues || loading}
      >
        {loading ? '生成中...' : '業務フローを生成'}
      </button>
      <div className="flex justify-end mt-4">
        <button
          onClick={nextStep}
          className="px-4 py-2 bg-green-500 text-white rounded"
          disabled={!customerInfo || !issues}
        >
          次へ
        </button>
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
}: Step2Props) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">ステップ2: ソリューションの選択</h2>
      <select
        value={selectedSolution}
        onChange={handleSolutionChange}
        className="w-full p-2 border rounded mb-4"
      >
        <option value="">ソリューションを選択してください</option>
        {solutions.map((solution) => (
          <option key={solution.id} value={solution.id}>
            {solution.name}
          </option>
        ))}
      </select>
      {solutionOverview && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <h3 className="font-medium">ソリューション概要:</h3>
          <p>{solutionOverview}</p>
        </div>
      )}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          前へ
        </button>
        <button
          onClick={nextStep}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={!selectedSolution}
        >
          次へ
        </button>
      </div>
    </div>
  );
};

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
}: Step3Props) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">ステップ3: ソリューションの評価</h2>
      <textarea
        className="w-full p-2 border rounded mb-4"
        placeholder="評価基準やその他必要なデータを入力してください"
        value={evaluation}
        onChange={(e) => setEvaluation(e.target.value)}
        rows={3}
      />
      <button
        onClick={handleEvaluate}
        className="px-4 py-2 bg-blue-500 text-white rounded mb-4"
        disabled={!evaluation || loading}
      >
        {loading ? '評価中...' : 'ソリューションを評価'}
      </button>
      {combination && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <h3 className="font-medium">最適なソリューションの組み合わせ:</h3>
          <p>{combination}</p>
        </div>
      )}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          前へ
        </button>
        <button
          onClick={handleGenerateProposal}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={!combination || loading}
        >
          {loading ? '提案生成中...' : '提案を生成'}
        </button>
      </div>
    </div>
  );
};

interface FinalStepProps {
  output: string;
  handleReset: () => void;
  prevStep: () => void;
}

const FinalStep = ({ output, handleReset, prevStep }: FinalStepProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">最終ステップ: 提案の確認</h2>
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h3 className="font-medium">生成された提案:</h3>
        <p>{output}</p>
      </div>
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          前へ
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          リセット
        </button>
      </div>
    </div>
  );
};
