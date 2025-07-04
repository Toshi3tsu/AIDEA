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
      return { ...state, solutionRequirements: action.payload };
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
  const [projects, setProjects] = useState<Project[]>([]);
  const { selectedProject, setSelectedProject } = useProjectStore();
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);

  useEffect(() => {
    if (selectedProject) {
      dispatch({ type: 'SET_CUSTOMER_INFO', payload: selectedProject.customer_name });
      dispatch({ type: 'SET_ISSUES', payload: selectedProject.issues });
      dispatch({ type: 'SET_GENERATED_FLOW', payload: selectedProject.bpmn_xml });
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
    try {
      const response = await axios.post('http://127.0.0.1:8000/ai/generate-requirements', {
        customer_info: state.customerInfo,
        issues: state.issues,
      });
      // 生成された要件テキストを保存
      dispatch({ type: 'SET_SOLUTION_REQUIREMENTS', payload: response.data.response });
    } catch (error) {
      console.error('Error generating requirements:', error);
      alert('ソリューション要件の生成に失敗しました。');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleGenerateFlow = async () => {
    if (!selectedProject) {
      alert('プロジェクトを選択してください。');
      return;
    }

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
    if (!selectedProject) {
      alert('プロジェクトを選択してください。');
      return;
    }

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
        <h1 className="text-3xl font-bold text-gray-800">業務改善AI</h1>
      </div>

      {selectedProject && renderStep()}

      {selectedProject && state.solutionRequirements && (
        <div className="mt-6">
          <div className="flex items-center mb-4">
            <img
              src="/icon.png"
              alt="コンサルタントアイコン"
              className="h-10 w-10 rounded-full ml-6 mr-3"
            />
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow">
              ソリューション要件の候補は以下です。
            </div>
          </div>
          <div className="mt-6 p-4 bg-yellow-100 rounded-lg shadow">
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
              alt="コンサルタントアイコン"
              className="h-10 w-10 rounded-full ml-6 mr-3"
            />
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow">
              作成した業務フローは以下です。
            </div>
          </div>

          {/* 業務フロー表示 */}
          <BpmnViewer xml={state.generatedFlow} projectId={selectedProject.id.toString()} />
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
          alt="コンサルタントアイコン"
          className="h-10 w-10 rounded-full mr-3 mb-4"
        />
        <div className="bg-[#CB6CE6]-100 text-blue-800 px-4 py-2 rounded-lg shadow mb-4">
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
            className="px-4 py-2 bg-[#CB6CE6] text-white rounded hover:bg-[#D69292] disabled:opacity-50"
            disabled={!customerInfo || !issues || loading}
          >
            {loading ? '生成中...' : '業務フロー生成'}
          </button>
        </div>
        <div className="flex justify-end">
          <button
            onClick={nextStep}
            className="px-4 py-2 bg-[#BF4242] text-white rounded hover:bg-[#76878F] disabled:opacity-50"
            disabled={!generatedFlow}
          >
            次へ
          </button>
        </div>
      </div>
      {/* {generatedFlow && (
        <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">生成された業務フロー:</h3>
        <textarea
          className="w-full p-2 border rounded mt-2"
          value={generatedFlow}
          readOnly
          rows={3}
        />
      </div>
    )} */}
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
