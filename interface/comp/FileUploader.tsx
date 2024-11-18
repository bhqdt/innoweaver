import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaFileImage, FaFilePdf, FaFileWord, FaFileAlt } from 'react-icons/fa';

type FileUploaderProps = {
    onUploadStatusChange: (status: boolean) => void;
};

const FileUploader: React.FC<FileUploaderProps> = ({ onUploadStatusChange }) => {
    const [files, setFiles] = useState<File[]>([]);

    // Handle file drop
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFiles(acceptedFiles);
            onUploadStatusChange(true);

            const filesData = acceptedFiles.map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        resolve({
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            content: reader.result // Base64 encoded content
                        });
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file); // Read file as Base64
                });
            });

            Promise.all(filesData)
                .then(serializedFiles => {
                    localStorage.setItem("fileItem", JSON.stringify(serializedFiles));
                    console.log("Files stored in localStorage:", serializedFiles);
                })
                .catch(error => console.error("Error reading files:", error));
        } else {
            onUploadStatusChange(false);
        }
    }, [onUploadStatusChange]);

    const { getRootProps, getInputProps } = useDropzone({ onDrop });

    // Render appropriate file icon based on file type
    const renderFileIcon = (file: File) => {
        const fileType = file.type;

        if (fileType.startsWith("image/")) return <FaFileImage className="text-blue-500 text-2xl" />;
        if (fileType === "application/pdf") return <FaFilePdf className="text-red-500 text-2xl" />;
        if (fileType.includes("word")) return <FaFileWord className="text-blue-700 text-2xl" />;
        return <FaFileAlt className="text-gray-500 text-2xl" />;
    };

    return (
        <div {...getRootProps()}
            className='flex flex-col w-full items-center justify-center
                        rounded-lg text-lg mt-2 border-2 border-dashed border-neutral-600 
                        p-5 bg-neutral-800 hover:bg-neutral-700 transition-all duration-300'
            style={{ height: '12rem' }}
        >
            <input {...getInputProps()} />
            {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-gray-400">
                    <p className="mb-2 text-base">Drag & drop files here, or click to select files</p>
                    {/* <p className="text-sm text-gray-500">(Supported formats: images, PDFs, Word documents)</p> */}
                </div>
            ) : (
                <div className="flex flex-col items-center w-full">
                    {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-center w-full h-full text-gray-300">
                            {renderFileIcon(file)}
                            <span className="ml-3 text-2xl font-semibold truncate">{file.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileUploader;
