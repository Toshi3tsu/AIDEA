// src/frontend/app/generate/page.tsx
'use client'

import { useReducer, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import BpmnViewer from './BpmnViewer';
import useFlowStore from '../store/flowStore';

interface Solution {
  id: string;
  name: string;
  category: string;
  features: string;
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
  const { generatedFlow, setGeneratedFlow } = useFlowStore();

  useEffect(() => {
    dispatch({ type: 'SET_GENERATED_FLOW', payload: generatedFlow });
    const fetchSolutions = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/solutions');
        if (!response.ok) throw new Error('Failed to fetch solutions');
        const data = await response.json();
        dispatch({ type: 'SET_SOLUTIONS', payload: data });
      } catch (error) {
        console.error('Error fetching solutions:', error);
        alert('Failed to load solutions.');
      }
    };
    fetchSolutions();
  }, [generatedFlow]);

  const handleGenerateFlow = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch('http://127.0.0.1:8000/api/ai/generate-flow', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_info: state.customerInfo,
          issues: state.issues,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'BPMNの生成に失敗しました。');
      }
      const data = await response.json();
      const cleanedFlow = data.flow.trim();
      dispatch({ type: 'SET_GENERATED_FLOW', payload: cleanedFlow });
      setGeneratedFlow(cleanedFlow);
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
      const response = await fetch('http://127.0.0.1:8000/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_info: state.customerInfo,
          project_info: state.issues, // ここはプロジェクト情報として扱う場合調整
          solution_id: state.selectedSolution,
        }),
      });
      if (!response.ok) throw new Error('Failed to generate proposal');
      const data = await response.json();
      dispatch({ type: 'SET_OUTPUT', payload: data.content || 'No output received' });
      dispatch({ type: 'NEXT_STEP' }); // 最終ステップに進む
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
      const response = await fetch('http://127.0.0.1:8000/api/ai/evaluate-solutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ evaluation: state.evaluation }),
      });
      if (!response.ok) throw new Error('Failed to evaluate solutions');
      const data = await response.json();
      dispatch({ type: 'SET_COMBINATION', payload: data.combination });
    } catch (error) {
      console.error('Error evaluating solutions:', error);
      alert('ソリューションの評価に失敗しました。');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleReset = () => {
    dispatch({ type: 'RESET' });
    useFlowStore.getState().setGeneratedFlow('');
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-custom">Analyzer</h1>
      {renderStep()}
      {state.generatedFlow && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">生成された業務フロー図</h2>
          <BpmnViewer xml={state.generatedFlow} />
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
  loading,
  nextStep,
}: Step1Props) => {
  useEffect(() => {
    // 初期テンプレートを設定
    setCustomerInfo('倉庫会社');
    setIssues('パレットの規格の違いや人手不足等もあり、荷下ろしに時間がかかっているため、物流のボトルネックになっている。そのため、荷下ろしの待機列が発生し、時間短縮のために作業にドライバーが駆り出されることになり、負担がかかっている。');
  }, []); // 依存配列に setter を入れる

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">ステップ1: 顧客情報と課題の入力</h2>
      <textarea
        className="w-full p-2 border rounded mb-4"
        placeholder="顧客情報を入力してください"
        value={customerInfo}
        onChange={(e) => setCustomerInfo(e.target.value)}
        rows={1}
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
      {generatedFlow && (
        <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">生成された業務フロー:</h3>
        <textarea
          className="w-full p-2 border rounded mt-2"
          value={generatedFlow}
          readOnly
          rows={3}
        />
      </div>
    )}
      <div className="flex justify-end mt-4">
        <button
          onClick={nextStep}
          className="px-4 py-2 bg-green-500 text-white rounded"
          disabled={!generatedFlow}
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
}: Step2Props) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h2 className="text-xl font-semibold mb-4">ステップ2: ソリューションの選択</h2>
    <div className="mb-4">
      <select
        className="w-full p-2 border rounded"
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
        className="px-4 py-2 bg-blue-500 text-white rounded"
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
          rows={4}
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
        className="px-4 py-2 bg-blue-500 text-white rounded"
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
