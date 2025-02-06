/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessageItem } from './MessageItem';
export type SaveChatRequest = {
    session_id: number;
    project_id: number;
    session_title: string;
    messages: Array<MessageItem>;
};

