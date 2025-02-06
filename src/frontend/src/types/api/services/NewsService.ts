/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NewsKeywordOut } from '../models/NewsKeywordOut';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NewsService {
    /**
     * Get Keywords
     * 保存されたニュースキーワードをデータベースから取得する
     * @returns NewsKeywordOut Successful Response
     * @throws ApiError
     */
    public static getKeywordsApiNewsKeywordsGet(): CancelablePromise<Array<NewsKeywordOut>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/news/keywords',
        });
    }
    /**
     * Update Keywords
     * ニュースキーワードをデータベースで更新する (全キーワードを置き換え)
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static updateKeywordsApiNewsKeywordsPost(
        requestBody: Array<string>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/news/keywords',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get News
     * キーワードに基づいてGoogleニュース記事を取得するAPIエンドポイント。
     * キャッシュを利用して一定時間内のリクエストは高速化。
     * @param keyword
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getNewsApiNewsNewsGet(
        keyword: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/news/news',
            query: {
                'keyword': keyword,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
