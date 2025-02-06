/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessageItem } from '../models/MessageItem';
import type { SaveChatRequest } from '../models/SaveChatRequest';
import type { SessionItem } from '../models/SessionItem';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ChatHistoryService {
    /**
     * Save Chat
     * @param requestBody
     * @returns MessageItem Successful Response
     * @throws ApiError
     */
    public static saveChatApiChatHistorySavePost(
        requestBody: SaveChatRequest,
    ): CancelablePromise<Array<MessageItem>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat_history/save',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Chat History
     * @param projectId
     * @param sessionId
     * @returns MessageItem Successful Response
     * @throws ApiError
     */
    public static getChatHistoryApiChatHistoryHistoryProjectIdSessionIdGet(
        projectId: number,
        sessionId: number,
    ): CancelablePromise<Array<MessageItem>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat_history/history/{project_id}/{session_id}',
            path: {
                'project_id': projectId,
                'session_id': sessionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Session Titles
     * @param projectId
     * @returns SessionItem Successful Response
     * @throws ApiError
     */
    public static getSessionTitlesApiChatHistorySessionsProjectIdGet(
        projectId: number,
    ): CancelablePromise<Array<SessionItem>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat_history/sessions/{project_id}',
            path: {
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Rename Session
     * @param projectId
     * @param sessionId
     * @param newTitle
     * @returns any Successful Response
     * @throws ApiError
     */
    public static renameSessionApiChatHistoryRenamePut(
        projectId: number,
        sessionId: number,
        newTitle: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/chat_history/rename',
            query: {
                'project_id': projectId,
                'session_id': sessionId,
                'new_title': newTitle,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Session
     * @param projectId
     * @param sessionId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteSessionApiChatHistoryDeleteDelete(
        projectId: number,
        sessionId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/chat_history/delete',
            query: {
                'project_id': projectId,
                'session_id': sessionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Move Session
     * @param oldProjectId
     * @param newProjectId
     * @param sessionId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static moveSessionApiChatHistoryMovePut(
        oldProjectId: number,
        newProjectId: number,
        sessionId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/chat_history/move',
            query: {
                'old_project_id': oldProjectId,
                'new_project_id': newProjectId,
                'session_id': sessionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
