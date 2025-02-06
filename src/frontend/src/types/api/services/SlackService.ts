/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProjectSlackLink } from '../models/ProjectSlackLink';
import type { SlackChannel } from '../models/SlackChannel';
import type { SlackSearchRequest } from '../models/SlackSearchRequest';
import type { SlackThread } from '../models/SlackThread';
import type { ThreadContentFromDBResponse } from '../models/ThreadContentFromDBResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SlackService {
    /**
     * Get Slack Channels
     * Slackワークスペース内のチャンネル一覧を取得
     * @returns SlackChannel Successful Response
     * @throws ApiError
     */
    public static getSlackChannelsApiSlackSlackChannelsGet(): CancelablePromise<Array<SlackChannel>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/slack/slack-channels',
        });
    }
    /**
     * Get Thread Content From Db
     * @param projectId
     * @param threadTs
     * @returns ThreadContentFromDBResponse Successful Response
     * @throws ApiError
     */
    public static getThreadContentFromDbApiSlackThreadContentFromDbGet(
        projectId: number,
        threadTs: string,
    ): CancelablePromise<ThreadContentFromDBResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/slack/thread-content-from-db',
            query: {
                'project_id': projectId,
                'thread_ts': threadTs,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Project Slack Links
     * @returns ProjectSlackLink Successful Response
     * @throws ApiError
     */
    public static getProjectSlackLinksApiSlackProjectSlackLinksGet(): CancelablePromise<Array<ProjectSlackLink>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/slack/project-slack-links',
        });
    }
    /**
     * Connect Slack Channel
     * @param requestBody
     * @returns ProjectSlackLink Successful Response
     * @throws ApiError
     */
    public static connectSlackChannelApiSlackConnectSlackPost(
        requestBody: ProjectSlackLink,
    ): CancelablePromise<ProjectSlackLink> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/slack/connect-slack',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Project Slack Channel
     * @param projectId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getProjectSlackChannelApiSlackProjectSlackProjectIdGet(
        projectId: number,
    ): CancelablePromise<(SlackChannel | null)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/slack/project-slack/{project_id}',
            path: {
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Disconnect Slack Channel
     * @param projectId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static disconnectSlackChannelApiSlackDisconnectSlackProjectIdDelete(
        projectId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/slack/disconnect-slack/{project_id}',
            path: {
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Search Slack Messages
     * @param requestBody
     * @returns SlackThread Successful Response
     * @throws ApiError
     */
    public static searchSlackMessagesApiSlackSearchMessagesPost(
        requestBody: SlackSearchRequest,
    ): CancelablePromise<Array<SlackThread>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/slack/search-messages',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Thread Messages
     * @param channelId
     * @param threadTs
     * @returns string Successful Response
     * @throws ApiError
     */
    public static getThreadMessagesApiSlackThreadMessagesGet(
        channelId: string,
        threadTs: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/slack/thread-messages',
            query: {
                'channel_id': channelId,
                'thread_ts': threadTs,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
