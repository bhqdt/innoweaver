"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import { FaUpload, FaArrowCircleUp, FaFileImage, FaFilePdf, FaFileWord, FaFileAlt, FaRedo, FaSearch } from 'react-icons/fa';
import Textarea from 'react-textarea-autosize';
import MiniCard from '@/comp/solution/MiniCard';
import { fetchQueryAnalysis, fetchComplete, fetchQuerySolution } from "@/lib/actions";
import CircularProgress from '@mui/material/CircularProgress';
import { LinearProgress } from '@mui/material';
import MeiliSearch from 'meilisearch';
import JsonViewer from '@/comp/paper/JsonViewer';
import { customFetch } from '@/lib/actions/customFetch';
import FileUploader from '@/comp/FileUploader';

const renderAnalysisResult = (analysisResult, handleQueryAnalysis) => {
  return (
    <div className="p-4 bg-neutral-800 rounded-lg text-sm font-normal">
      <button className="absolute top-15 right-8 cursor-pointer" onClick={handleQueryAnalysis}>
        <FaRedo className="text-gray-400 hover:text-gray-100 text-xl" />
      </button>

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
  );
};

const renderUploadSteps = (isFileUploaded, isMessageSent) => {
  return (
    <>
      <div className="flex items-center">
        <input
          type="checkbox"
          className="appearance-none h-6 w-6 mr-2 pointer-events-none
                        border-2 border-gray-100 rounded-md checked:bg-green-400"
          checked={isFileUploaded}
          readOnly
        />
        <span> 1. Upload User Document.</span>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          className="appearance-none h-6 w-6 mr-2 pointer-events-none
                        border-2 border-gray-100 rounded-md checked:bg-green-400"
          checked={isMessageSent}
          readOnly
        />
        <span> 2. Provide Initial Concept.</span>
      </div>
    </>
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

  // const isFileUploaded = files.length > 0;
  // const isMessageSent = messages.length > 0;

  // ---------------------------------------------------------------------------------- //

  const renderFileIcon = (file: File) => {
    const fileType = file.type;

    if (fileType.startsWith("image/")) return <FaFileImage className="text-blue-500 text-2xl" />;
    if (fileType === "application/pdf") return <FaFilePdf className="text-red-500 text-2xl" />;
    if (fileType.includes("word")) return <FaFileWord className="text-blue-700 text-2xl" />;
    return <FaFileAlt className="text-gray-500 text-2xl" />;
  };

  // Handle file drop
  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    onDrop: (acceptedFiles) => {
      // setFiles(['']);
      if (acceptedFiles.length > 0) {
        setFiles([acceptedFiles[0]]);
      }
    }
  });

  // ---------------------------------------------------------------------------------- //

  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const callQueryAnalysis = async (inputText, files, setAnalysisResult, setIsAnalysisLoading) => {
    try {
      setIsAnalysisLoading(true);
      console.log(inputText);
      console.log(files[0]);
      const analysisResult = await fetchQueryAnalysis(inputText, files[0]);

      console.log(analysisResult);
      const result = JSON.parse(analysisResult);
      console.log('Analysis result:', result);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  // useEffect(() => {
  //   console.log(isFileUploaded, isMessageSent);
  //   if (isFileUploaded && isMessageSent) {
  //     handleQueryAnalysis();
  //   }
  // }, [isFileUploaded, isMessageSent]);

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
    // const apiUrl = "http://120.55.193.195:5001";
    const token = localStorage.getItem("token");
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` }),
      };
      const body = JSON.stringify(data);
      const response = await fetch(`${apiUrl}${url}`, { method: 'POST', headers: headers, body: body, });
      const result = await response.json();

      console.log(result);
      setProgress(result.progress);
      setStatusMessage(result.status);

      return result
    } catch (error) {
      console.error(`Error in ${url}:`, error);
      throw error;
    }
  }

  async function pollTaskStatus(taskId) {
    const apiUrl = `http://120.55.193.195:5001/api/complete/status/${taskId}`;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(apiUrl, { method: 'GET' });
        const result = await response.json();

        setProgress(result.progress);
        setStatusMessage(result.status);
        console.log(result);
        console.log(result.status);

        if (result.status === "completed") {
          clearInterval(interval);  // 停止轮询
          // setCompleteResult(result);
          setIsCompleteLoading(false);
          // console.log("Task completed:", result);
        } else if (result.status === "error" || result.status === "unknown") {
          clearInterval(interval);  // 停止轮询
          setStatusMessage("Task failed");
          console.error("Task error:", result);
          setIsCompleteLoading(false);
        }
      } catch (error) {
        console.error("Error while polling task status:", error);
        clearInterval(interval);
        setIsCompleteLoading(false);
      }
    }, 2000); // 每2秒轮询一次
  }

  const handleGenerate = async () => {
    setIsCompleteLoading(true);
    setStatusMessage("Starting task...");

    try {
      const initResponse = await callStepApi('/api/complete/initialize', { data: JSON.stringify(analysisResult) });
      setTaskId(initResponse.task_id);
      console.log("init:", initResponse);

      await callStepApi('/api/complete/rag', { task_id: initResponse.task_id });
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
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(''); // 搜索查询
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const apiUrl = process.env.API_URL.replace(':5000', ':7700/'); // API 地址

  const client = useMemo(() => new MeiliSearch({ host: apiUrl }), [apiUrl]);
  const scrollContainerRef = useRef(null);
  const fetchPapers = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setLoading(true);
    try {
      const index = client.index('paper_id');
      const searchResults = await index.search(searchQuery, {
        offset: (pageNumber - 1) * 10,
        limit: 10,
      });
      setPapers((prev) => (pageNumber === 1 ? searchResults.hits : [...prev, ...searchResults.hits]));
      setHasMore(searchResults.hits.length > 0); // 如果当前批次小于10，则可能没有更多数据
    } catch (error) {
      console.error('Error fetching papers:', error);
    } finally {
      setLoading(false);
    }
  }, [client]);

  const [selectedPapers, setSelectedPapers] = useState([]);
  const togglePaperSelection = (paper) => {
    setSelectedPapers((prevSelected) => {
      if (prevSelected.some((p) => p.id === paper.id)) {
        return prevSelected.filter((p) => p.id !== paper.id); // 取消选择
      } else {
        return [...prevSelected, paper]; // 选中
      }
    });
  };

  // 你的 ID 列表
  const ids = [
    '67363e5aafa2b7939a60e368',
    '67363e5aafa2b7939a60e369',
    '67363e5aafa2b7939a60e357',
    '67363e5aafa2b7939a60e358',
    '67363e5aafa2b7939a60e353',
    '67363e5aafa2b7939a60e361'
  ];

  // 更新选择的ID
  const handleSelectChange = (event) => {
    const selectedOptions = Array.from((event.target as HTMLSelectElement).selectedOptions);
    const ids = selectedOptions.map((option) => option.value);
    setSelectedIds(ids);
  };


  // 处理模式变化
  const handleModeChange = (event) => {
    const mode = event.target.value;
    setSelectedMode(mode);
    if (mode === 'paper') {
      setPapers([]);
      setPage(1);
      fetchPapers(query, 1);
    }
  };

  // 搜索查询变化
  const handleSearch = (event) => {
    setQuery(event.target.value);
    setPage(1);
    fetchPapers(event.target.value, 1); // 查询更新时从第一页开始加载
  };

  // 处理滚动加载更多
  const handleScroll = () => {
    if (
      scrollContainerRef.current &&
      scrollContainerRef.current.scrollTop + scrollContainerRef.current.clientHeight >=
      scrollContainerRef.current.scrollHeight - 5
    ) {
      if (!loading && hasMore) {
        setPage((prevPage) => prevPage + 1);
      }
    }
  };

  // 监听页码变化以加载更多
  useEffect(() => {
    if (page > 1) fetchPapers(query, page);
  }, [page, fetchPapers, query]);

  // 设置滚动事件监听
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // ---------------------------------------------------------------------------------- //

  return (
    <div className='flex justify-center bg-neutral-900 text-white min-h-full ml-48'>
      <div className='flex w-[85rem] min-h-screen flex-col items-center justify-center'>
        <div className='flex w-full h-[45rem] bg-neutral-800 rounded-2xl'>

          <div className='relative w-1/3 ml-6 mt-6 mb-6 rounded-lg bg-neutral-950'>
            <div className='flex justify-between items-center'>
              <div className='text-neutral-300 text-2xl font-semibold ml-5 mt-2'> Input </div>

              {/* 添加的下拉选项 */}
              {/* <select
                className='mr-5 mt-2 p-2 rounded-md bg-neutral-800 text-neutral-300'
                value={selectedMode}
                onChange={handleModeChange}
              >
                <option value="chat">Chat</option>
                <option value="solution">Solution</option>
                <option value="paper">Paper</option>
              </select> */}
            </div>

            <div className='flex flex-col items-center mt-2 ml-5 mr-5 h-[92.5%] rounded-lg'>
              <div className='flex w-full h-1/3 items-center justify-center  overflow-auto'>
                <div className='flex h-full w-full items-center justify-center flex-col rounded-lg 
                                        text-xl font-semibold text-zinc-400 gap-4'>
                  <>
                    {isAnalysisLoading ? (
                      <div className="flex justify-center items-center">
                        <CircularProgress />
                      </div>
                    ) : analysisResult ? (
                      renderAnalysisResult(analysisResult, handleQueryAnalysis)
                    ) : (
                      // renderUploadSteps(isFileUploaded, isMessageSent)
                      <div>

                      </div>
                    )}
                  </>
                </div>
              </div>
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
                    <p className="text-sm text-gray-500 font-bold">(Only Support .txt)</p>
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

              <div className='flex flex-col h-1/3 w-full rounded-lg m-4'>
                <div className='rounded-lg h-5/6 p-4 bg-neutral-900'>
                  <Textarea
                    className="w-full bg-transparent text-neutral-200 placeholder-neutral-400"
                    placeholder="Please type your question here..."
                    minRows={6}
                    maxRows={6}
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    onChange={(e) => setInputText(e.target.value)}
                  />
                </div>

                {analysisResult ? (
                  <div className='w-full flex justify-between mt-2'>
                    <button className='text-green-200 mr-2 text-lg font-bold
                                            bg-neutral-600 px-4 py-1 rounded-md'
                      onClick={handleGenerate}>
                      <p> Generate! </p>
                    </button>
                    <button className='text-white mr-2' onClick={handleSendMessage}>
                      <FaArrowCircleUp className='text-3xl' />
                    </button>
                  </div>
                ) : (
                  <div className='w-full flex justify-end mt-2'>
                    <button className='text-white mr-2' onClick={handleSendMessage}>
                      <FaArrowCircleUp className='text-3xl' />
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className='relative w-2/3 m-6 rounded-lg bg-neutral-950 overflow-auto'>
            {/* <div className="flex justify-end p-4">
              <select
                multiple
                className="p-2 rounded-md bg-neutral-800 text-neutral-300"
                value={selectedIds}
                onChange={handleSelectChange}
                style={{ minWidth: '200px' }}
              >
                {ids.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div> */}

            <div className="flex w-full h-full">
              {isCompleteLoading ? (
                <div className="flex flex-col w-full h-full justify-center items-center">
                  <div style={{ width: '80%', marginTop: '20px' }}>
                    <LinearProgress variant="determinate" value={progress} />
                    <p>{progress}%</p>
                  </div>
                  {/* <div>{statusMessage}</div> */}
                </div>
              ) : completeResult ? (
                <div className="flex flex-col text-sm font-normal p-4 gap-4">
                  {/* 重新生成按钮 */}
                  <div className="flex justify-end">
                    <button
                      className="text-gray-400 hover:text-gray-100 text-xl cursor-pointer"
                      onClick={handleRegenerate}
                    >
                      <FaRedo /> {/* 使用重新生成图标 */}
                    </button>
                  </div>

                  <div className="bg-neutral-900 p-4 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-neutral-100">
                      {completeResult['title']}
                    </h2>
                  </div>

                  <div className="bg-neutral-700 p-4 rounded-lg shadow-md overflow-auto">
                    <p className="text-md text-neutral-300">
                      {completeResult['desc']}
                    </p>
                  </div>

                  <div className="text-neutral-300 text-4xl font-bold
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
                      <p className="text-lg text-neutral-500">No solutions available.</p>
                    )}

                  </div>
                </div>

              ) : (
                <div className="flex w-full h-full justify-center items-center">
                  {/* {selectedMode === 'solution' && (
                    <div className="flex flex-col items-center justify-center w-11/12 max-w-sm p-6 h-auto bg-neutral-900 rounded-lg shadow-md space-y-4">
                      <h3 className="text-neutral-300 font-semibold text-xl mb-1">Select Solution IDs</h3>
                      <select
                        multiple
                        className="p-3 rounded-md bg-neutral-800 text-neutral-300 w-full border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 overflow-y-auto"
                        value={selectedIds}
                        onChange={handleSelectChange}
                        style={{ maxHeight: '200px' }}
                      >
                        {ids.map((id) => (
                          <option key={id} value={id} className="p-2 text-sm hover:bg-neutral-700">
                            {id}
                          </option>
                        ))}
                      </select>
                      <p className="text-sm text-neutral-500 text-center">You can select multiple solution IDs</p>
                    </div>
                  )} */}

                  {/* {selectedMode === 'paper' && (
                    <div className="flex flex-row items-start justify-center w-full h-full 
                      max-w-4xl bg-neutral-900 p-6 rounded-lg shadow-lg space-x-6">
                      <div className="flex flex-col items-center w-2/3 h-full max-w-2xl">
                        <div className="relative w-full mb-4">
                          <input
                            type="text"
                            className="w-full p-3 rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Search papers..."
                            value={query}
                            onChange={handleSearch}
                          />
                          <FaSearch className="absolute top-1/2 right-4 transform -translate-y-1/2 text-neutral-500" />
                        </div>

                        <div
                          ref={scrollContainerRef}
                          className="w-full overflow-y-auto pr-2 space-y-3"
                        >
                          {loading && page === 1 ? (
                            <p className="text-neutral-300 text-lg">Loading papers...</p>
                          ) : (
                            papers.map((paper) => (
                              <div
                                key={paper.id}
                                className={`cursor-pointer p-3 rounded-lg border ${selectedPapers.some((p) => p.id === paper.id) ? 'border-indigo-500 bg-indigo-700' : 'border-transparent bg-neutral-850'
                                  } hover:border-neutral-600 transition`}
                                onClick={() => togglePaperSelection(paper)}
                              >
                                <JsonViewer jsonData={paper} />
                              </div>
                            ))
                          )}
                        </div>

                        {!loading && !hasMore && (
                          <p className="text-sm text-neutral-500 text-center mt-4">No more papers to load</p>
                        )}
                      </div>

                      <div className="w-1/3 h-full p-4 bg-neutral-800 rounded-lg shadow-md">
                        <h3 className="text-neutral-300 font-semibold text-lg mb-4">Selected Papers</h3>
                        {selectedPapers.length > 0 ? (
                          <ul className="text-neutral-300 space-y-2">
                            {selectedPapers.map((paper) => (
                              <li key={paper.id} className="text-sm">
                                <strong>ID:</strong> {paper["_id"]}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-neutral-500">No papers selected.</p>
                        )}
                      </div>
                    </div>
                  )} */}


                  {(selectedMode !== 'solution' && selectedMode !== 'paper') && (
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
