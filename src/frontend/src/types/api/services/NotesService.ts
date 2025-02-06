/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Note } from '../models/Note';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NotesService {
    /**
     * Get Note
     * @param projectId
     * @returns Note Successful Response
     * @throws ApiError
     */
    public static getNoteApiNotesProjectIdGet(
        projectId: number,
    ): CancelablePromise<Note> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/notes/{project_id}',
            path: {
                'project_id': projectId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Save Note
     * @param requestBody
     * @returns Note Successful Response
     * @throws ApiError
     */
    public static saveNoteApiNotesPost(
        requestBody: Note,
    ): CancelablePromise<Note> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/notes/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
