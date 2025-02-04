# backend/api/text_extract.py
import os
from fastapi import HTTPException
from PyPDF2 import PdfReader
import json

def extract_text_from_file(file_path: str) -> str:
    """
    ファイルパスからテキストを抽出する関数。
    """
    file_extension = os.path.splitext(file_path)[1].lower()

    if file_extension == '.txt':
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except UnicodeDecodeError:
            with open(file_path, 'r', encoding='cp932') as file: # Shift-JIS
                return file.read()
    elif file_extension == '.pdf':
        text = ""
        try:
            reader = PdfReader(file_path)
            for page in reader.pages:
                text += page.extract_text()
            return text
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"PDFファイル読み込みエラー: {e}")
    elif file_extension == '.boxnote':
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                boxnote_json = json.load(file)
                return boxnote_to_markdown(boxnote_json)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"BoxNoteファイル読み込みエラー: {e}")
    else:
        raise HTTPException(status_code=400, detail="対応していないファイル形式です。")

# boxnoteJsonToMarkdown を backend に移動
def boxnote_to_markdown(json_data: dict) -> str:
    if not json_data or not json_data.get('doc') or not json_data['doc'].get('content'):
        return ''

    def process_content(content):
        markdown = ''
        if not isinstance(content, list):
            return markdown  # Return empty string if content is not a list
        for node in content:
            node_type = node.get('type')
            if node_type == 'heading':
                markdown += f"{'#' * node['attrs'].get('level', 1)} {process_inline_content(node.get('content', []))}\n"
            elif node_type == 'paragraph':
                if node.get('content'):
                    markdown += f"{process_inline_content(node.get('content'))}\n\n"
                else:
                    markdown += '\n'
            elif node_type == 'bullet_list':
                markdown += process_list(node.get('content', []), '* ')
            elif node_type == 'ordered_list':
                markdown += process_list(node.get('content', []), '1. ')
            elif node_type == 'list_item':
                markdown += process_content(node.get('content', []))
            elif node_type == 'horizontal_rule':
                markdown += '---\n'
            elif node_type == 'text':
                markdown += process_text(node)
            elif node_type == 'hard_break':
                markdown += '\n'
            elif node_type == 'image':
                alt_text = node['attrs'].get('alt', 'image')
                src = node['attrs'].get('src', node['attrs'].get('boxSharedLink'))
                markdown += f"![{alt_text}]({src})\n"
            elif node_type == 'embed':
                title = node['attrs'].get('title', '')
                url = node['attrs'].get('url', '')
                markdown += f"[{title}]({url})\n"
            elif node_type == 'doc':
                markdown += process_content(node.get('content', []))
            else:
                print(f"Unknown node type: {node_type}")
                markdown += process_content(node.get('content', []))
        return markdown

    def process_inline_content(content):
        inline_markdown = ''
        if not isinstance(content, list):
            return inline_markdown
        for node in content:
            node_type = node.get('type')
            if node_type == 'text':
                inline_markdown += process_text(node)
            elif node_type == 'hard_break':
                inline_markdown += '\n'
            elif node_type == 'image':
                alt_text = node['attrs'].get('alt', 'image')
                src = node['attrs'].get('src', node['attrs'].get('boxSharedLink'))
                inline_markdown += f"![{alt_text}]({src})"
            elif node_type == 'embed':
                title = node['attrs'].get('title', '')
                url = node['attrs'].get('url', '')
                inline_markdown += f"[{title}]({url})"
        return inline_markdown

    def process_text(node):
        text = node.get('text', '')
        if node.get('marks'):
            for mark in node['marks']:
                mark_type = mark.get('type')
                if mark_type == 'strong':
                    text = f"**{text}**"
                elif mark_type == 'highlight':
                    color = mark['attrs'].get('color', 'yellow')
                    text = f"<mark style='background-color: {color}'>{text}</mark>"
        return text

    def process_list(content, prefix):
        list_markdown = ''
        index = 1
        if not isinstance(content, list):
            return list_markdown
        for item in content:
            if item.get('type') == 'list_item':
                current_prefix = f"{index}. " if prefix == '1. ' else prefix
                item_content = process_content(item.get('content', []))
                item_content = ' '.join(item_content.split())  # Replace multiple spaces and newlines with a single space
                list_markdown += f"{current_prefix}{item_content}\n"
                if prefix == '1. ':
                    index += 1
        list_markdown += '\n'
        return list_markdown

    # Process the root content
    return process_content(json_data['doc'].get('content', []))
