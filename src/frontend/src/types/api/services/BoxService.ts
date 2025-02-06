/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseDirectoryRequest } from '../models/BaseDirectoryRequest';
import type { BoxFolderLinkRequest } from '../models/BoxFolderLinkRequest';
import type { LocalFileRequest } from '../models/LocalFileRequest';
import type { ProjectBase } from '../models/ProjectBase';
import type { UploadedFileResponse } from '../models/UploadedFileResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BoxService {
    /**
     * Get Projects
     * @returns ProjectBase Successful Response
     * @throws ApiError
     */
    public static getProjectsApiBoxProjectsGet(): CancelablePromise<Array<ProjectBase>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/box/projects',
        });
    }
    /**
     * Create Project
     * @param requestBody
     * @returns ProjectBase Successful Response
     * @throws ApiError
     */
    public static createProjectApiBoxProjectsPost(
        requestBody: ProjectBase,
    ): CancelablePromise<ProjectBase> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/box/projects',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Extract Text From File
     * @param projectId
     * @param filename
     * @returns any Successful Response
     * @throws ApiError
     */
    public static extractTextFromFileApiBoxExtractTextFromFileProjectIdFilenameGet(
        projectId: number,
        filename: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/box/extract-text-from-file/{project_id}/{filename}',
            path: {
                'project_id': projectId,
                'filename': filename,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Base Directory
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getBaseDirectoryApiBoxBaseDirectoryGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/box/base-directory',
        });
    }
    /**
     * Set Base Directory
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static setBaseDirectoryApiBoxBaseDirectoryPut(
        requestBody: BaseDirectoryRequest,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/box/base-directory',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Connect Box Folder
     * @param projectId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static connectBoxFolderApiBoxConnectProjectIdPut(
        projectId: number,
        requestBody: BoxFolderLinkRequest,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/box/connect/{project_id}',
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
     * Disconnect Box Folder
     * プロジェクトからBoxフォルダの相対パスの紐づけを解除。
     * CSVの box_folder_path をクリアする処理。
     * @param projectId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static disconnectBoxFolderApiBoxDisconnectProjectIdDelete(
        projectId: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/box/disconnect/{project_id}',
            path: {
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Local Files
     * @param requestBody
     * @returns UploadedFileResponse Successful Response
     * @throws ApiError
     */
    public static listLocalFilesApiBoxListLocalFilesPost(
        requestBody: LocalFileRequest,
    ): CancelablePromise<Array<UploadedFileResponse>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/box/list-local-files',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get All Files
     * すべてのプロジェクトのファイル一覧を取得する。
     * @param projectId
     * @returns UploadedFileResponse Successful Response
     * @throws ApiError
     */
    public static getAllFilesApiBoxFilesGet(
        projectId: number,
    ): CancelablePromise<Array<UploadedFileResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/box/files',
            query: {
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Files By Project
     * 特定のプロジェクトのファイル一覧を取得する。
     * @param projectId
     * @returns UploadedFileResponse Successful Response
     * @throws ApiError
     */
    public static getFilesByProjectApiBoxFilesProjectIdGet(
        projectId: number,
    ): CancelablePromise<Array<UploadedFileResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/box/files/{project_id}',
            path: {
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
