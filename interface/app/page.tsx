"use client";

import { useState, useEffect } from 'react';
import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FaUpload,
  FaArrowCircleUp,
  FaFileImage,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileCode,
  FaFileAlt,
  FaRedo,
} from 'react-icons/fa';
import Box from '@mui/material';
import Textarea from 'react-textarea-autosize';
import MiniCard from '@/comp/solution/MiniCard';
import {
  fetchQueryAnalysis,
  fetchComplete,
  fetchQuerySolution,
} from "@/lib/actions";
import CircularProgress from '@mui/material/CircularProgress';
import { LinearProgress } from '@mui/material';
import FileUploader from '@/comp/FileUploader';
import PaperSearch from '@/comp/main/PaperSearch';
import SolutionSearch from '@/comp/main/SolutionSearch';
// import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set the workerSrc to the CDN URL with the correct version
// pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.min.mjs'

const renderAnalysisResult = (analysisResult, handleQueryAnalysis) => {
  return (
    <div className="p-4 bg-secondary rounded-lg text-sm font-normal relative">
      <button className="absolute top-2 right-2 cursor-pointer" onClick={handleQueryAnalysis}>
        <FaRedo className="text-gray-400 hover:text-gray-100 text-xl" />
      </button>

      <div className='overflow-auto'>
        <p>
          <span className="text-gray-500 font-bold">TARGET USER:</span>
          <span className="ml-2"> {analysisResult['Targeted User'] || 'N/A'} </span>
        </p>
        <br />

        <p>
          <span className="text-gray-500 font-bold">USAGE SCENARIO:</span>
          <span className="ml-2"> {analysisResult['Usage Scenario'] || 'N/A'} </span>
        </p>
        <br />

        <p>
          <span className="text-gray-500 font-bold">REQUIREMENTS:</span>
          <span className="ml-2">
            {Array.isArray(analysisResult['Requirement'])
              ? analysisResult['Requirement'].join(', ')
              : 'N/A'}
          </span>
        </p>
      </div>

    </div>
  );
};

const GenerateSolution = () => {
  const [id, setId] = useState('');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    const storedId = localStorage.getItem("id");
    if (storedId) {
      setId(storedId);
    }
  }, []);

  const handleSendMessage = () => {
    console.log(inputText);
    setMessages('');
    if (inputText.trim()) {
      setMessages(inputText);
      handleQueryAnalysis();
    }
  };

  // ---------------------------------------------------------------------------------- //

  const getFileExtension = (fileName: string) => {
    return fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
  };

  const renderFileIcon = (file: File) => {
    const extension = getFileExtension(file.name);

    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
        return <FaFileImage className="text-blue-500 text-2xl" />;
      // case 'pdf':
      //   return <FaFilePdf className="text-red-500 text-2xl" />;
      case 'doc':
      case 'docx':
        return <FaFileWord className="text-blue-700 text-2xl" />;
      case 'xls':
      case 'xlsx':
        return <FaFileExcel className="text-green-500 text-2xl" />;
      case 'md':
        return <FaFileCode className="text-purple-500 text-2xl" />;
      case 'txt':
        return <FaFileAlt className="text-gray-500 text-2xl" />;
      default:
        return <FaFileAlt className="text-gray-500 text-2xl" />;
    }
  };

  // Handle file drop
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFiles([acceptedFiles[0]]);
      }
    },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp'],
      // 'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/markdown': ['.md'],
      'text/plain': ['.txt'],
    },
  });

  // ---------------------------------------------------------------------------------- //

  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  const callQueryAnalysis = async (
    inputText: string,
    files: File[],
    setAnalysisResult: React.Dispatch<React.SetStateAction<any>>,
    setIsAnalysisLoading: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    try {
      setIsAnalysisLoading(true);
      let fileContent = '';
      if (files && files.length > 0) {
        const file = files[0];
        fileContent = await readFileContent(file);
        console.log(fileContent);
      }
      const analysisResult = await fetchQueryAnalysis(inputText, fileContent);
      const result = JSON.parse(analysisResult);
      console.log('Analysis result:', result);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  const readFileContent = async (file: File): Promise<string> => {
    const extension = getFileExtension(file.name);

    if (extension === 'txt' || extension === 'md') {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result;
          if (typeof result === 'string') {
            resolve(result);
          } else {
            reject(new Error('File content is not a string.'));
          }
        };
        reader.onerror = (error) => {
          reject(error);
        };
        reader.readAsText(file);
      });
    }
    // else if (extension === 'pdf') {
    //   return await extractTextFromPDF(file);
    // } 
    else if (extension === 'docx' || extension === 'doc') {
      return await extractTextFromDocx(file);
    } else {
      throw new Error('Unsupported file type.');
    }
  };

  // const extractTextFromPDF = async (file: File): Promise<string> => {
  //   const loadingTask = pdfjsLib.getDocument({ url: URL.createObjectURL(file) });
  //   const pdf = await loadingTask.promise;
  //   let textContent = '';

  //   for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
  //     const page = await pdf.getPage(pageNum);
  //     const text = await page.getTextContent();
  //     const pageText = text.items.map((item: any) => item.str).join(' ');
  //     textContent += pageText + '\n';
  //   }

  //   return textContent;
  // };

  const extractTextFromDocx = async (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result;
        if (arrayBuffer instanceof ArrayBuffer) {
          try {
            const result = await mammoth.extractRawText({ arrayBuffer });
            resolve(result.value);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('Could not read file as ArrayBuffer.'));
        }
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleQueryAnalysis = () => {
    callQueryAnalysis(inputText, files, setAnalysisResult, setIsAnalysisLoading);
  };

  // ---------------------------------------------------------------------------------- //

  const [taskId, setTaskId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Initializing...");
  const [isCompleteLoading, setIsCompleteLoading] = useState(false);
  const [completeResult, setCompleteResult] = useState(null);

  async function callStepApi(url, data) {
    const apiUrl = process.env.API_URL;
    const token = localStorage.getItem("token");
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` }),
      };
      const body = JSON.stringify(data);
      const response = await fetch(`${apiUrl}${url}`, { method: 'POST', headers: headers, body: body });
      const result = await response.json();

      console.log(result);
      setProgress(result.progress);
      setStatusMessage(result.status);

      return result;
    } catch (error) {
      console.error(`Error in ${url}:`, error);
      throw error;
    }
  }

  const handleGenerate = async () => {
    setIsCompleteLoading(true);
    setStatusMessage("Starting task...");

    try {
      const initResponse = await callStepApi('/api/complete/initialize', { data: JSON.stringify(analysisResult) });
      setTaskId(initResponse.task_id);
      console.log("init:", initResponse);

      const mode = selectedMode;
      if (mode === "inspirtaion") {
        await callStepApi('/api/complete/example', { task_id: initResponse.task_id, data: JSON.stringify(selectedIds) });
      } else if (mode === "paper") {
        await callStepApi('/api/complete/paper', { task_id: initResponse.task_id, data: JSON.stringify(selectedIds) });
      } else {
        await callStepApi('/api/complete/rag', { task_id: initResponse.task_id });
      }

      await callStepApi('/api/complete/domain', { task_id: initResponse.task_id });
      await callStepApi('/api/complete/interdisciplinary', { task_id: initResponse.task_id });
      await callStepApi('/api/complete/evaluation', { task_id: initResponse.task_id });
      await callStepApi('/api/complete/drawing', { task_id: initResponse.task_id });

      const result = await callStepApi('/api/complete/final', { task_id: initResponse.task_id });
      console.log('Complete result:', result);
      setCompleteResult(result);
    } catch (error) {
      console.error("Error during task generation:", error);
      setTaskId('');
      setIsCompleteLoading(false);
    } finally {
      setTaskId('');
      setProgress(0);
      setIsCompleteLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setIsCompleteLoading(true);
    setStatusMessage("Starting task...");

    try {
      const solution_ids = JSON.stringify(
        completeResult['solutions'].map((solution) => solution.id)
      );
      console.log(solution_ids);

      const initResponse = await callStepApi('/api/complete/initialize', { data: JSON.stringify(analysisResult) });
      setTaskId(initResponse.task_id);
      console.log("init:", initResponse);

      await callStepApi('/api/complete/example', { task_id: initResponse.task_id, data: solution_ids });
      console.log("Example step completed");
      await callStepApi('/api/complete/interdisciplinary', { task_id: initResponse.task_id });
      await callStepApi('/api/complete/evaluation', { task_id: initResponse.task_id });
      await callStepApi('/api/complete/drawing', { task_id: initResponse.task_id });

      const result = await callStepApi('/api/complete/final', { task_id: initResponse.task_id });
      console.log('Complete result:', result);
      setCompleteResult(result);
    } catch (error) {
      console.error("Error during task generation:", error);
      setTaskId('');
      setIsCompleteLoading(false);
    } finally {
      setTaskId('');
      setProgress(0);
      setIsCompleteLoading(false);
    }
  };

  // ---------------------------------------------------------------------------------- //

  const [selectedMode, setSelectedMode] = useState('chat');
  const [selectedIds, setSelectedIds] = useState([]);

  const handleIDSelection = (ids) => {
    setSelectedIds(ids);
    console.log(selectedIds);
  };

  const handleModeChange = (event) => {
    const mode = event.target.value;
    setSelectedMode(mode);
    setSelectedIds([]);
  };

  // ---------------------------------------------------------------------------------- //

  return (
    <div className='flex ml-[12.5rem] justify-center bg-primary text-text-primary min-h-full transition-colors duration-300'>
      <div className='flex w-[85rem] min-h-screen flex-col items-center justify-center'>
        <div className='flex w-full h-[45rem] bg-secondary rounded-2xl'>

          <div className='relative w-1/3 ml-6 mt-6 mb-6 rounded-lg bg-primary'>
            <div className='flex justify-between items-center'>
              <div className='text-text-secondary text-2xl font-semibold ml-5 mt-2'>Input</div>

              <select
                className='mr-5 mt-2 p-2 rounded-md bg-secondary text-text-secondary font-semibold'
                value={selectedMode}
                onChange={handleModeChange}
              >
                <option value="chat" className='font-semibold'>Chat</option>
                <option value="inspirtaion" className='font-semibold'>Inspirtaion</option>
                {/* <option value="paper">Paper</option> */}
              </select>
            </div>

            <div className='flex flex-col items-center mt-2 ml-5 mr-5 h-5/6 rounded-lg gap-4'>
              <div className="flex-1 h-1/3 rounded-lg ">
                {isAnalysisLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <CircularProgress />
                  </div>
                ) : analysisResult ? (
                  renderAnalysisResult(analysisResult, handleQueryAnalysis)
                ) : (
                  <div className="h-full"></div>
                )}
              </div>

              <div className='flex w-full h-1/3 rounded-lg items-center justify-center
                border-2 border-dashed border-neutral-600 cursor-pointer hover:bg-secondary-hover
                bg-secondary transition-all duration-300 mt-2'>
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  {files.length === 0 ? (
                    <div className="text-center text-text-placeholder">
                      <p className="mb-2">Drag & drop files here, or click to select files</p>
                      <p className="text-sm font-bold text-text-secondary">(Supports .txt, .docx, .md, .xlsx)</p>
                    </div>
                  ) : (
                    <div className="flex items-center w-full">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-center w-full">
                          {renderFileIcon(file)}
                          <span className="ml-3 text-lg font-semibold truncate">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* <div className='flex w-full h-1/3 rounded-lg items-center justify-center 
                bg-secondary transition-all duration-300'>
                <Textarea
                  className="w-full bg-transparent text-text-primary placeholder:text-gray-400 p-2
                  placeholder-opacity-75 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  placeholder="Please type your question here..."
                  minRows={6}
                  maxRows={6}
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  aria-label="Type your question here"
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div> */}
              <div className="flex-1 w-full rounded-lg bg-secondary items-center justify-center">
                <Textarea
                  className="w-full h-full bg-transparent text-text-primary placeholder:text-gray-400 p-2 
                    placeholder-opacity-75 focus:ring focus:ring-blue-500 focus:ring-opacity-50 resize-none"
                  placeholder="Please type your question here..."
                  minRows={6}
                  maxRows={6}
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  aria-label="Type your question here"
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div>
            </div>

            {analysisResult ? (
              <div className='w-full flex justify-between mt-2'>
                <button className='text-text-secondary ml-5 text-lg font-bold
                                        bg-secondary px-4 rounded-md'
                  onClick={handleGenerate}>
                  <p>Generate!</p>
                </button>
                <button className='text-text-primary mr-6' onClick={handleSendMessage}>
                  <FaArrowCircleUp className='text-3xl' />
                </button>
              </div>
            ) : (
              <div className='w-full flex justify-end mt-2'>
                <button className='text-text-primary mr-6' onClick={handleSendMessage}>
                  <FaArrowCircleUp className='text-3xl' />
                </button>
              </div>
            )}
          </div>

          <div className='relative w-2/3 m-6 rounded-lg bg-primary overflow-auto'>
            <div className="flex w-full h-full">
              {isCompleteLoading ? (
                // <div className="flex flex-col w-full h-full justify-center items-center">
                //   <div style={{ width: '80%', marginTop: '20px' }}>
                //     <LinearProgress variant="determinate" value={progress} />
                //     <p>{progress}%</p>
                //   </div>
                // </div>
                <div className="flex flex-col justify-center items-center h-full w-full">
                  <div className="w-4/5 mt-2">
                    <div className="flex items-center mt-1">
                      <div className="w-full mr-1">
                        <LinearProgress variant="determinate" value={progress} />
                      </div>
                      <div className="min-w-[35px]">
                        <p className="text-sm text-gray-500">{`${Math.round(progress)}%`}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{statusMessage}</p>
                  </div>
                </div>
              ) : completeResult ? (
                <div className="flex flex-col text-sm font-normal p-4 gap-4">
                  <div className="flex justify-end">
                    <button
                      className="text-text-secondary hover:text-text-primary text-xl cursor-pointer"
                      onClick={handleRegenerate}
                    >
                      <FaRedo />
                    </button>
                  </div>

                  <div className="bg-primary p-4 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-text-primary">
                      {completeResult['title']}
                    </h2>
                  </div>

                  <div className="bg-secondary p-4 rounded-lg shadow-md overflow-auto">
                    <p className="text-md text-text-secondary">
                      {completeResult['desc']}
                    </p>
                  </div>

                  <div className="text-text-primary text-4xl font-bold
                              flex w-full h-auto items-center justify-center
                              gap-1 flex-wrap overflow-auto">

                    {completeResult['solutions']?.length ? (
                      completeResult['solutions'].map((solution, index) => (
                        <div key={index}>
                          <MiniCard
                            key={index}
                            content={solution}
                            index={index}
                            isLiked={false}
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-base sm:text-lg text-text-placeholder">No inspirations available.</p>
                    )}

                  </div>
                </div>
              ) : (
                <div className="flex w-full h-full justify-center items-center">
                  {selectedMode === 'inspirtaion' && (
                    <SolutionSearch onSelectionChange={handleIDSelection} />
                  )}

                  {selectedMode === 'paper' && (
                    <PaperSearch onSelectionChange={handleIDSelection} />
                  )}

                  {(selectedMode !== 'inspirtaion' && selectedMode !== 'paper') && (
                    <p className='font-bold text-4xl'>No result available yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
};

export default GenerateSolution;
