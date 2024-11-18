import React, { useState } from 'react';
import './JsonViewer.css'
import Link from 'next/link';

// 节点展示的组件，包含展开/折叠功能
const JsonNode = ({ keyName, value }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isExpandable = typeof value === 'object' && value !== null;

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div style={{ marginLeft: '20px' }}>
            <div onClick={isExpandable ? toggleOpen : null} 
                className={isExpandable ? 'flex items-center cursor-pointer' : 'flex items-center'}
            >
                {isExpandable && (
                    <span className='cursor-pointer mr-1'>{isOpen ? '▼' : '▶'}</span>
                )}
                <div className='font-bold whitespace-nowrap'>{keyName}:</div>
                {!isExpandable && keyName === '_id' && (
                    <div className='ml-2'>
                        <Link href={`/paper/${value}`} target="_blank" rel="noopener noreferrer"
                            className='no-underline text-[#77EEFF]'>
                            {`${value}`}
                        </Link>
                    </div>
                )}
                {!isExpandable && keyName !== '_id' && (
                    <div className="flex items-center ml-2.5">
                        <span className="inline-block whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer">
                            {value}
                        </span>
                    </div>
                )}
            </div>

            {isExpandable && isOpen && (
                <div style={{ marginLeft: '20px' }}>
                    {Array.isArray(value) ? (
                        value.map((item, index) => (
                            <JsonNode key={index} keyName={index} value={item} />
                        ))
                    ) : (
                        Object.keys(value).map((subKey) => (
                            <JsonNode key={subKey} keyName={subKey} value={value[subKey]} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const JsonViewer = ({ jsonData }) => {
    const orderedKeys = ["_id", "Title", "Author", "Keywords", "Cited", "Liked", "DOI", "Series",
        "Target Definition", "Artifact Knowledge", "Results", "Second Extraction"];

    const renderOrderedJson = (data) => {
        const keys = Object.keys(data);
        const ordered = orderedKeys.filter((key) => keys.includes(key));
        const rest = keys.filter((key) => !orderedKeys.includes(key));
        return [...ordered, ...rest].map((key) => (
            <JsonNode key={key} keyName={key} value={data[key]} />
        ));
    };

    return (
        <div className='ViewWrapper'>
            <div
                style={{
                    maxHeight: '100%',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                }}
            >
                {renderOrderedJson(jsonData)}
            </div>
        </div>
    );
};

export default JsonViewer;
