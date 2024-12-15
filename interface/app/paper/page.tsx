"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MeiliSearch } from 'meilisearch';
import JsonViewer from '@/comp/paper/JsonViewer';
import { FaSearch, FaUpload } from 'react-icons/fa';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

const Papers = () => {
    // const apiUrl = process.env.API_URL.replace(':5000', ':7700/');
    const apiUrl = '120.55.193.195:7700/';
    const [loading, setLoading] = useState(false);
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
                setHasMore(searchResults.hits.length === 10);
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
        setHasMore(true);

        if (query !== '') {
            fetchPapers(query, 1);
        }
    };

    const handleScroll = useCallback(() => {
        if (
            scrollContainerRef.current &&
            scrollContainerRef.current.scrollTop + scrollContainerRef.current.clientHeight >=
            scrollContainerRef.current.scrollHeight - 5
        ) {
            if (!loading && hasMore) {
                setPage((prevPage) => prevPage + 1);
            }
        }
    }, [loading, hasMore]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener("scroll", handleScroll);
            return () => container.removeEventListener("scroll", handleScroll);
        }
    }, [handleScroll]);

    useEffect(() => {
        if (query !== '' && page > 1) {
            fetchPapers(query, page);
        }
    }, [page, query, fetchPapers]);

    return (
        <div
            ref={scrollContainerRef}
            className="h-screen overflow-y-auto ml-[12.5rem] bg-primary text-text-primary"
        >
            <div className="flex flex-col items-center mt-8">
                <header className="mb-6 w-full flex items-center justify-center px-6 max-w-5xl">
                    {/* <Link href="/paper/upload" passHref>
                        <div
                            role="button"
                            className="mr-4 p-2 bg-secondary text-text-primary rounded-full hover:bg-secondary transition-colors duration-300 cursor-pointer flex items-center"
                        >
                            <FaUpload size={20} />
                        </div>
                    </Link> */}

                    <form onSubmit={handleSearch} className="flex justify-center flex-grow max-w-3xl">
                        <div className="relative w-full">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-placeholder">
                                <FaSearch />
                            </span>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search papers by keyword"
                                className="w-full pl-12 pr-4 py-3 text-lg border border-border-primary rounded-lg bg-primary text-text-primary outline-none shadow focus:ring focus:ring-border-secondary focus:border-border-secondary transition-all duration-300"
                            />
                        </div>
                    </form>
                </header>
            </div>

            <AnimatePresence>
                {loading && page === 1 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-lg mt-24 text-center text-text-secondary"
                    >
                        Loading...
                    </motion.div>
                ) : query === '' ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-lg mt-24 text-center text-text-secondary"
                    >
                        {query ? "No results found. Try a different search term." : "Enter a keyword to search for papers."}
                    </motion.div>
                ) : error ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center mt-24 text-red-500"
                    >
                        {error}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <ul className="list-none p-0">
                            <AnimatePresence>
                                {papers.map((paper, index) => (
                                    <motion.li
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                        className="mb-2"
                                    >
                                        <JsonViewer jsonData={paper} />
                                    </motion.li>
                                ))}
                            </AnimatePresence>
                        </ul>
                        {loading && page > 1 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center mt-4 text-text-secondary"
                            >
                                Loading more...
                            </motion.div>
                        )}
                        {!loading && !hasMore && papers.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center mt-4 text-text-secondary"
                            >
                                No more results to load.
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Papers;

