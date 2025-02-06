/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ArchiveProjectUpdate } from '../models/ArchiveProjectUpdate';
import type { BusinessFlowAnalysisRequest } from '../models/BusinessFlowAnalysisRequest';
import type { BusinessFlowAnalysisResponse } from '../models/BusinessFlowAnalysisResponse';
import type { BusinessFlowRequest } from '../models/BusinessFlowRequest';
import type { BusinessFlowResponse } from '../models/BusinessFlowResponse';
import type { FlowUpdate } from '../models/FlowUpdate';
import type { GenerateVariationsRequest } from '../models/GenerateVariationsRequest';
import type { ProjectCreate } from '../models/ProjectCreate';
import type { ProjectOut } from '../models/ProjectOut';
import type { ProjectUpdate } from '../models/ProjectUpdate';
import type { ProposalCreate } from '../models/ProposalCreate';
import type { RequirementsRequest } from '../models/RequirementsRequest';
import type { RequirementsResponse } from '../models/RequirementsResponse';
import type { RequirementsUpdate } from '../models/RequirementsUpdate';
import type { ResearchRequest } from '../models/ResearchRequest';
import type { ResearchResponse } from '../models/ResearchResponse';
import type { SlackUpdate } from '../models/SlackUpdate';
import type { SolutionCreate } from '../models/SolutionCreate';
import type { SolutionEvaluationRequest } from '../models/SolutionEvaluationRequest';
import type { SolutionEvaluationResponse } from '../models/SolutionEvaluationResponse';
import type { SolutionOut } from '../models/SolutionOut';
import type { SolutionUpdate } from '../models/SolutionUpdate';
import type { StageUpdate } from '../models/StageUpdate';
import type { SubmitPromptRequest } from '../models/SubmitPromptRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Get Project Proposal
     * @param projectId
     * @param solutionRequirements
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getProjectProposalApiProposalsProjectIdProposalGet(
        projectId: number,
        solutionRequirements?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/proposals/{project_id}/proposal',
            path: {
                'project_id': projectId,
            },
            query: {
                'solution_requirements': solutionRequirements,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Proposal
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createProposalApiProposalsPost(
        requestBody: ProposalCreate,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/proposals/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Solutions
     * Retrieve all solutions from the database.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getSolutionsApiSolutionsGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/solutions/',
        });
    }
    /**
     * Create Solution
     * Add a new solution to the database.
     * @param requestBody
     * @returns SolutionOut Successful Response
     * @throws ApiError
     */
    public static createSolutionApiSolutionsPost(
        requestBody: SolutionCreate,
    ): CancelablePromise<SolutionOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/solutions/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Solution
     * Retrieve a single solution by ID from the database.
     * @param solutionId
     * @returns SolutionOut Successful Response
     * @throws ApiError
     */
    public static getSolutionApiSolutionsSolutionIdGet(
        solutionId: string,
    ): CancelablePromise<SolutionOut> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/solutions/{solution_id}',
            path: {
                'solution_id': solutionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Solution
     * Update an existing solution in the database.
     * @param solutionId
     * @param requestBody
     * @returns SolutionOut Successful Response
     * @throws ApiError
     */
    public static updateSolutionApiSolutionsSolutionIdPut(
        solutionId: string,
        requestBody: SolutionUpdate,
    ): CancelablePromise<SolutionOut> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/solutions/{solution_id}',
            path: {
                'solution_id': solutionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Solution
     * Delete a solution from the database.
     * @param solutionId
     * @returns void
     * @throws ApiError
     */
    public static deleteSolutionApiSolutionsSolutionIdDelete(
        solutionId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/solutions/{solution_id}',
            path: {
                'solution_id': solutionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Research Ai
     * リクエスト内容に基づいて、選択されたLLMを使用してリサーチを実行します。
     * @param requestBody
     * @returns ResearchResponse Successful Response
     * @throws ApiError
     */
    public static researchAiApiAiResearchAiPost(
        requestBody: ResearchRequest,
    ): CancelablePromise<ResearchResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ai/research-ai',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Generate Variations
     * プロンプトの言い換えパターンを生成します。
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static generateVariationsApiAiGenerateVariationsPost(
        requestBody: GenerateVariationsRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ai/generate-variations',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Submit Prompt
     * 指定されたLLMにプロンプトを送信します。
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static submitPromptApiAiSubmitPromptPost(
        requestBody: SubmitPromptRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ai/submit-prompt',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Generate Flow
     * @param requestBody
     * @returns BusinessFlowResponse Successful Response
     * @throws ApiError
     */
    public static generateFlowApiAiGenerateFlowPost(
        requestBody: BusinessFlowRequest,
    ): CancelablePromise<BusinessFlowResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ai/generate-flow',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Analyze Business Flow Endpoint
     * @param requestBody
     * @returns BusinessFlowAnalysisResponse Successful Response
     * @throws ApiError
     */
    public static analyzeBusinessFlowEndpointApiAiAnalyzeBusinessFlowPost(
        requestBody: BusinessFlowAnalysisRequest,
    ): CancelablePromise<BusinessFlowAnalysisResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ai/analyze-business-flow',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Generate Requirements Endpoint
     * 顧客情報と課題に基づいて、ソリューション要件を生成するエンドポイント。
     * @param requestBody
     * @returns RequirementsResponse Successful Response
     * @throws ApiError
     */
    public static generateRequirementsEndpointApiAiGenerateRequirementsPost(
        requestBody: RequirementsRequest,
    ): CancelablePromise<RequirementsResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ai/generate-requirements',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Evaluate Solutions Endpoint
     * @param requestBody
     * @returns SolutionEvaluationResponse Successful Response
     * @throws ApiError
     */
    public static evaluateSolutionsEndpointApiAiEvaluateSolutionsPost(
        requestBody: SolutionEvaluationRequest,
    ): CancelablePromise<SolutionEvaluationResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ai/evaluate-solutions',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Project Tasks
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getProjectTasksApiProjectTasksGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/project_tasks/',
        });
    }
    /**
     * Get Projects
     * @returns ProjectOut Successful Response
     * @throws ApiError
     */
    public static getProjectsApiProjectsGet(): CancelablePromise<Array<ProjectOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/projects/',
        });
    }
    /**
     * Create Project
     * @param requestBody
     * @returns ProjectOut Successful Response
     * @throws ApiError
     */
    public static createProjectApiProjectsPost(
        requestBody: ProjectCreate,
    ): CancelablePromise<ProjectOut> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/projects/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Project
     * @param projectId
     * @param requestBody
     * @returns ProjectOut Successful Response
     * @throws ApiError
     */
    public static updateProjectApiProjectsProjectIdPut(
        projectId: number,
        requestBody: ProjectUpdate,
    ): CancelablePromise<ProjectOut> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/projects/{project_id}',
            path: {
                'project_id': projectId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Project
     * @param projectId
     * @returns void
     * @throws ApiError
     */
    public static deleteProjectApiProjectsProjectIdDelete(
        projectId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/projects/{project_id}',
            path: {
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Archive Project
     * @param projectId
     * @param requestBody
     * @returns ProjectOut Successful Response
     * @throws ApiError
     */
    public static archiveProjectApiProjectsProjectIdArchivePut(
        projectId: number,
        requestBody: ArchiveProjectUpdate,
    ): CancelablePromise<ProjectOut> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/projects/{project_id}/archive',
            path: {
                'project_id': projectId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Stage
     * @param projectId
     * @param requestBody
     * @returns ProjectOut Successful Response
     * @throws ApiError
     */
    public static updateStageApiProjectsProjectIdStagePut(
        projectId: number,
        requestBody: StageUpdate,
    ): CancelablePromise<ProjectOut> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/projects/{project_id}/stage',
            path: {
                'project_id': projectId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Flow
     * @param projectId
     * @param requestBody
     * @returns ProjectOut Successful Response
     * @throws ApiError
     */
    public static updateFlowApiProjectsProjectIdFlowPut(
        projectId: number,
        requestBody?: FlowUpdate,
    ): CancelablePromise<ProjectOut> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/projects/{project_id}/flow',
            path: {
                'project_id': projectId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Flow
     * @param projectId
     * @returns ProjectOut Successful Response
     * @throws ApiError
     */
    public static deleteFlowApiProjectsProjectIdFlowDelete(
        projectId: number,
    ): CancelablePromise<ProjectOut> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/projects/{project_id}/flow',
            path: {
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Requirements
     * @param projectId
     * @param requestBody
     * @returns ProjectOut Successful Response
     * @throws ApiError
     */
    public static updateRequirementsApiProjectsProjectIdRequirementsPut(
        projectId: number,
        requestBody?: RequirementsUpdate,
    ): CancelablePromise<ProjectOut> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/projects/{project_id}/requirements',
            path: {
                'project_id': projectId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Project Powerpoint
     * @param projectId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getProjectPowerpointApiProjectsProjectIdPowerpointGet(
        projectId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/projects/{project_id}/powerpoint',
            path: {
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Connect Slack Channel
     * プロジェクトにSlackチャンネルを連携し、タグも登録する
     * @param projectId
     * @param requestBody
     * @returns ProjectOut Successful Response
     * @throws ApiError
     */
    public static connectSlackChannelApiProjectsProjectIdSlackPut(
        projectId: number,
        requestBody: SlackUpdate,
    ): CancelablePromise<ProjectOut> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/projects/{project_id}/slack',
            path: {
                'project_id': projectId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Disconnect Slack Channel
     * プロジェクトからSlackチャンネル連携を解除（チャンネルIDやタグをクリア）
     * @param projectId
     * @returns ProjectOut Successful Response
     * @throws ApiError
     */
    public static disconnectSlackChannelApiProjectsProjectIdSlackDelete(
        projectId: number,
    ): CancelablePromise<ProjectOut> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/projects/{project_id}/slack',
            path: {
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Root
     * @returns any Successful Response
     * @throws ApiError
     */
    public static rootGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/',
        });
    }
}
