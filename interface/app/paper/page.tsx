"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MeiliSearch } from 'meilisearch';
import JsonViewer from '@/comp/paper/JsonViewer';
import { FaSearch, FaUpload } from 'react-icons/fa';
import Link from 'next/link';

const Papers = () => {
    const apiUrl = process.env.API_URL.replace(':5000', ':7700/');
    const [loading, setLoading] = useState(true);
    const [papers, setPapers] = useState([]);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const scrollContainerRef = useRef(null);

    const client = useMemo(() => new MeiliSearch({ host: apiUrl }), [apiUrl]);
    const fetchPapers = useCallback(async (searchQuery = '', pageNumber = 1) => {
        setLoading(true);
        try {
            const index = client.index('paper_id');
            const searchResults = await index.search(searchQuery, {
                limit: 10,
                offset: (pageNumber - 1) * 10,
            });
            if (searchResults.hits.length > 0) {
                setPapers((prevPapers) => (pageNumber === 1 ? searchResults.hits : [...prevPapers, ...searchResults.hits]));
                setHasMore(true);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            setError('Error fetching papers');
        } finally {
            setLoading(false);
        }
    }, [client]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        setPapers([]);

        if (query != '') {
            fetchPapers(query, 1);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            if (scrollContainerRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
                if (scrollTop + clientHeight >= scrollHeight - 50 && !loading && hasMore) {
                    setPage((prevPage) => prevPage + 1);
                }
            }
        };

        const container = scrollContainerRef.current;
        container?.addEventListener('scroll', handleScroll);
        return () => container?.removeEventListener('scroll', handleScroll);
    }, [loading, hasMore]);

    return (
        <div
            ref={scrollContainerRef}
            style={{ height: '100vh', overflowY: 'auto', marginLeft: '15rem' }}
        >
            <div className="flex flex-col items-center mt-8">
                <header className="mb-6 w-full flex items-center justify-center px-6 max-w-5xl">
                    {/* 上传按钮 */}
                    {/* <Link href="/paper/upload" passHref>
                        <div
                            role="button"
                            className="mr-4 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-colors duration-200 cursor-pointer flex items-center"
                        >
                            <FaUpload size={20} />
                        </div>
                    </Link> */}

                    {/* 搜索栏 */}
                    <form onSubmit={handleSearch} className="flex justify-center flex-grow max-w-3xl">
                        <div className="relative w-full">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400">
                                <FaSearch />
                            </span>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search papers by keyword"
                                className="w-full pl-12 pr-4 py-3 text-lg border border-neutral-700 rounded-lg bg-neutral-800 text-neutral-100 outline-none shadow focus:ring focus:ring-neutral-700 focus:border-neutral-500 transition-all duration-300"
                            />
                        </div>
                    </form>
                </header>
            </div>

            {loading && page === 1 ? (
                <div style={{ fontSize: '24px', marginTop: '100px', textAlign: 'center' }}>
                    Loading...
                </div>
            ) : error ? (
                <div style={{ color: 'red', textAlign: 'center', marginTop: '100px' }}>
                    {error}
                </div>
            ) : (
                <div>
                    <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                        {papers.map((paper, index) => (
                            <li key={index} style={{ marginBottom: '0.5rem' }}>
                                <JsonViewer jsonData={paper} />
                            </li>
                        ))}
                    </ul>
                    {loading && page > 1 && (
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>Loading more...</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Papers;
