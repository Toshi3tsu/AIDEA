/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExtractionRequest } from '../models/ExtractionRequest';
import type { ExtractionResponse } from '../models/ExtractionResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TaskService {
    /**
     * Extract Tasks
     * OpenAI APIを使用して議事録からタスクを抽出します。
     * @param requestBody
     * @returns ExtractionResponse Successful Response
     * @throws ApiError
     */
    public static extractTasksApiTaskExtractTasksPost(
        requestBody: ExtractionRequest,
    ): CancelablePromise<ExtractionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/task/extract-tasks',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
