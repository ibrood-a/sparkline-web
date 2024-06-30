// components/markdown-editor.tsx
import React from 'react';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange }) => {
  const handleEditorChange = ({ html, text }: { html: string; text: string }) => {
    onChange(text);
  };

  return (
    <MdEditor
      value={value}
      className={'h-full bg-background rounded-md p-4 border border-primary/10 focus:border-primary/50 focus:ring focus:ring-primary/50 focus:ring-opacity-50'}
      renderHTML={(text) => mdParser.render(text)}
      onChange={handleEditorChange}
    />
  );
};

export default MarkdownEditor;
