"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchViewPrompts, fetchModifyPrompt } from '@/lib/actions';
import { Editor, EditorState, ContentState } from 'draft-js';
import 'draft-js/dist/Draft.css';

interface Prompts {
    [key: string]: string; // 提示词名称为字符串，内容为字符串
}

export default function ViewPrompts() {
    const [id, setId] = useState('');
    useEffect(() => {
        const storedId = localStorage.getItem("id");

        if (storedId) {
            setId(storedId);
        }
    }, []);

    const router = useRouter();
    const formatPromptName = (prompt) => {
        const formatted = prompt.charAt(0).toUpperCase() + prompt.slice(1).toLowerCase();
        return formatted.replace(/_/g, ' ');
    };

    const [prompts, setPrompts] = useState<Prompts>({});

    // 获取提示词
    useEffect(() => {
        async function loadPrompts() {
            try {
                const fetchedPrompts = await fetchViewPrompts();
                setPrompts(fetchedPrompts);
            } catch (error) {
                console.error("Error fetching prompts:", error);
            }
        }

        loadPrompts();
    }, []);

    const updatePrompts = async (promptName: string, newContent: string) => {
        alert("更新成功");
        const result = await fetchModifyPrompt(promptName, newContent);
        console.log(result);
    };

    return (
        <div className='user_history_container bg-primary transition-colors duration-300'>
            {/* 下拉选择提示词 */}
            <div className='prompts_container'>
                {Object.entries(prompts).map(([promptName, promptContent]) => {
                    const formattedPromptName = formatPromptName(promptName);
                    return (
                        <div key={promptName}
                            style={{
                                display: 'flex', marginTop: '20px', backgroundColor: '#232323', padding: '15px',
                            }}>
                            <label style={{
                                width: '210px',
                                color: 'white',
                                fontWeight: 'bold',
                                marginTop: '40px',
                                marginRight: '10px',
                                // wordBreak: 'break-all',
                            }}>
                                {formattedPromptName}
                            </label>

                            <PromptEditor initialContent={promptContent}
                                onChange={(newContent) => setPrompts((prevPrompts) => ({
                                    ...prevPrompts,
                                    [promptName]: newContent
                                }))} />
                            <button
                                style={{
                                    marginLeft: '20px', backgroundColor: '#EEEEEE', color: '#171717', fontWeight: 'bold',
                                    width: '80px', height: '40px', marginTop: '100px', borderRadius: '10px',
                                }}
                                onClick={() => updatePrompts(promptName, promptContent)}>
                                update
                            </button>
                        </div>
                    );
                })}
            </div>

        </div>
    );
}

interface PromptEditorProps {
    initialContent: string;
    onChange: (newContent: string) => void;
}

const PromptEditor: React.FC<PromptEditorProps> = ({ initialContent, onChange }) => {
    const [editorState, setEditorState] = useState(() =>
        EditorState.createWithContent(ContentState.createFromText(initialContent))
    );

    const handleEditorStateChange = (state: EditorState) => {
        setEditorState(state);
        const content = state.getCurrentContent().getPlainText();
        onChange(content);
    };

    return (
        <div style={{
            flex: 1,
            marginLeft: '10px',
            height: '300px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '10px',
            width: '50%',
            overflowY: 'auto',
        }}>
            <Editor
                editorState={editorState}
                onChange={handleEditorStateChange}
                placeholder="开始输入..."
            />
        </div>
    );
};