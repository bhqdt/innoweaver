"use client";

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaFilePdf } from 'react-icons/fa';

const PaperUpload = () => {
    const [file, setFile] = useState<File | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const uploadedFile = acceptedFiles[0];
            if (uploadedFile.type === 'application/pdf') {
                setFile(uploadedFile);
                setErrorMessage(null);
                console.log("File uploaded:", uploadedFile);
            } else {
                setErrorMessage("Only PDF files are supported.");
                setFile(null);
            }
        }
    }, []);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { 'application/pdf': [] },
    });

    return (
        <div className="flex flex-col items-center mt-8 space-y-4">
            <div
                {...getRootProps({
                    className:
                        'flex flex-col items-center justify-center border border-dashed border-gray-500 p-8 rounded-lg cursor-pointer hover:border-gray-700 transition ease-in-out duration-200 focus:outline-none focus:border-blue-500',
                })}
                aria-label="File Upload Area"
            >
                <input {...getInputProps()} />
                <FaFilePdf className="text-gray-500 text-4xl mb-2" />
                <p className="font-semibold text-lg text-gray-700">Drag and drop a file here, or click to select one</p>
                <p className="text-sm text-gray-500">Only PDF files are supported</p>
            </div>

            {/* Display the uploaded file name in an input field */}
            <input
                type="text"
                readOnly
                value={file ? file.name : ''}
                placeholder="No file selected"
                className="mt-4 border border-gray-300 rounded-lg p-2 w-64 text-center text-gray-600"
            />

            {errorMessage && (
                <p className="mt-4 text-red-500 font-medium">
                    {errorMessage}
                </p>
            )}
        </div>
    );
};

export default PaperUpload;
