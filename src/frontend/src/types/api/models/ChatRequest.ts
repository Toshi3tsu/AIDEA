/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessageItem } from './MessageItem';
export type ChatRequest = {
    message: string;
    model: string;
    source_type: string;
    source_id?: (string | null);
    source_content?: (string | null);
    source_name?: (string | Array<string> | null);
    source_path?: (string | null);
    chat_history?: (Array<MessageItem> | null);
};

