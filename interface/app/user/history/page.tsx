"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MeiliSearch } from 'meilisearch';
import MiniCard from '@/comp/solution/MiniCard';
import Masonry from 'react-masonry-css';
import { fetchQueryLikedSolutions } from '@/lib/actions';
import { FaSearch } from 'react-icons/fa';

interface MasonryGalleryProps {
    solutions: any[];
    likedSolutions: { [key: string]: boolean };
}

const MasonryGallery: React.FC<MasonryGalleryProps> = ({ solutions, likedSolutions }) => {
    const columns = Math.min(5, solutions.length);
    const breakpointColumnsObj = {
        default: columns,
        1600: Math.min(4, solutions.length),
        1200: Math.min(3, solutions.length),
        800: Math.min(2, solutions.length),
        640: 1,
    };

    const [likes, setLikes] = useState({});
    useEffect(() => {
        setLikes(likedSolutions);
    }, [likedSolutions]);

    return (
        <div className="flex justify-center p-4 w-full">
            <Masonry
                breakpointCols={breakpointColumnsObj}
                className="flex"
                columnClassName="masonry-grid_column flex flex-col"
            >
                {solutions.map((solution, index) => (
                    <MiniCard
                        key={index}
                        content={solution}
                        index={index}
                        isLiked={likes[solution.id]}
                    />
                ))}
            </Masonry>
        </div>
    );
};


const History = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const page = searchParams.get('page') || '1';  // Default to page 1
    const query = searchParams.get('query') || '';  // Default to an empty query string
    const pageNumber = parseInt(page, 20);  // Convert page number to an integer
    const [queryState, setQuery] = useState(query);

    const [loading, setLoading] = useState(true);
    const [solutions, setSolutions] = useState([]);
    const [likedSolutions, setLikedSolutions] = useState({});
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [totalPages, setTotalPages] = useState(0);

    const apiUrl = '120.55.193.195:7700/';
    const client = useMemo(() => new MeiliSearch({ host: apiUrl }), [apiUrl]);

    const fetchSolutionCount = useCallback(async (searchQuery = '') => {
        try {
            const id = localStorage.getItem('id');
            const index = client.index('solution_id');
            const searchResults = await index.search(searchQuery, {
                limit: 0,  // 不需要返回实际的文档，只需要获取总数
                filter: [`user_id="${id}"`],
            });
            return searchResults.estimatedTotalHits;
        } catch (error) {
            setError('Error fetching solution count');
            return 0;
        }
    }, [client]);

    const fetchSolutions = useCallback(async (searchQuery = '', pageNumber = 1) => {
        setLoading(true);
        try {
            const totalCount = await fetchSolutionCount(searchQuery);
            console.log(totalCount);
            setTotalPages(Math.ceil(totalCount / 20));

            const id = localStorage.getItem('id');
            const index = client.index('solution_id');
            const searchResults = await index.search(searchQuery, {
                limit: 20,
                offset: (pageNumber - 1) * 20,
                sort: ['timestamp:desc'],
                filter: [`user_id="${id}"`],
            });

            if (searchResults.hits.length > 0) {
                const modifiedResults = searchResults.hits.map((hit) => ({
                    ...hit,
                    id: hit._id,
                    _id: undefined,
                }));

                setSolutions((prevSolutions) =>
                    pageNumber === 1 ? modifiedResults : [...prevSolutions, ...modifiedResults]
                );

                const solutionIds = modifiedResults.map(solution => solution.id);
                const likedStatuses = await fetchQueryLikedSolutions(solutionIds);

                const newLikedStates = likedStatuses.reduce((acc, { solution_id, isLiked }) => {
                    acc[solution_id] = isLiked;
                    return acc;
                }, {});

                setLikedSolutions((prevLiked) => ({
                    ...prevLiked,
                    ...newLikedStates,
                }));

                setHasMore(true);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            setError('Error fetching solutions');
        } finally {
            setLoading(false);
        }
    }, [client, fetchSolutionCount]);

    // Reset the solutions and liked solutions when query or page changes
    useEffect(() => {
        setSolutions([]);  // Clear existing solutions
        setLikedSolutions({});  // Clear liked solutions
        setHasMore(true);  // Reset "has more" flag
        setLoading(true);  // Start loading state

        fetchSolutions(queryState, pageNumber);  // Fetch new data based on query and page
    }, [queryState, pageNumber, fetchSolutions]);

    useEffect(() => {
        if (queryState) {
            router.push(`/user/history?page=1&query=${queryState}`);
        } else {
            router.push(`/user/history?page=1`);  // Clear query if it's empty
        }
    }, [queryState, router]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (queryState) {
            router.push(`/user/history?page=1&query=${queryState}`); // Update the query in the URL
        } else {
            router.push(`/user/history?page=1`);  // Clear query if it's empty
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage <= totalPages && newPage > 0) {
            router.push(`/user/history?page=${newPage}&query=${queryState}`);
        }
    };

    const handlePageInputChange = (e) => {
        const newPage = parseInt(e.target.value, 10);
        if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
            router.push(`/user/history?page=${newPage}&query=${queryState}`);
        }
    };

    const renderPagination = () => {
        const pagesToShow = [];
        const range = 3; // Number of pages to show on either side of the current page
        let startPage = Math.max(1, pageNumber - range);
        let endPage = Math.min(totalPages, pageNumber + range);

        if (startPage > 1) {
            pagesToShow.push(1);
            if (startPage > 2) pagesToShow.push('...');
        }

        for (let i = startPage; i <= endPage; i++) {
            pagesToShow.push(i);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pagesToShow.push('...');
            pagesToShow.push(totalPages);
        }

        return pagesToShow.map((page, index) => (
            <React.Fragment key={index}>
                {page === '...' ? (
                    <span className="px-4 py-2">...</span>
                ) : (
                    <button
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 border rounded-lg ${page === pageNumber ? 'bg-secondary text-text-primary' : 'bg-primary text-text-secondary'}`}
                    >
                        {page}
                    </button>
                )}
            </React.Fragment>
        ));
    };

    return (
        <div className="h-screen overflow-y-auto ml-[12.5rem] bg-primary text-text-primary transition-colors duration-300">
            <div className="flex justify-center mt-8 mb-2">
                <header className="text-center w-full">
                    <form onSubmit={handleSearch} className="flex justify-center">
                        <div className="relative w-[80%] max-w-3xl">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-placeholder">
                                <FaSearch />
                            </span>
                            <input
                                type="text"
                                value={queryState}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search Inspirtaions"
                                className="w-full pl-12 pr-4 py-3 text-lg border border-secondary rounded-lg bg-secondary text-text-primary outline-none shadow focus:ring focus:ring-secondary focus:border-neutral-500 transition-all duration-300"
                            />
                        </div>
                    </form>
                </header>
            </div>

            {loading && pageNumber === 1 ? (
                <div className="text-2xl mt-24 text-center text-text-secondary">
                    Loading...
                </div>
            ) : error ? (
                <div className="text-center mt-24 text-red-500">
                    {error}
                </div>
            ) : (
                <div>
                    <MasonryGallery solutions={solutions} likedSolutions={likedSolutions} />
                    {loading && pageNumber > 1 && (
                        <div className="text-center mt-4 text-text-placeholder">Loading more...</div>
                    )}

                    {/* Pagination Controls */}
                    <div className="flex justify-center mt-2 mb-6 space-x-2">
                        <button
                            onClick={() => handlePageChange(pageNumber - 1)}
                            disabled={pageNumber === 1}
                            className="px-4 py-2 border rounded-lg bg-primary text-text-primary"
                        >
                            Previous
                        </button>
                        {renderPagination()}
                        {/* <div className="flex justify-center mt-4">
                            <input
                                type="number"
                                min="1"
                                max={totalPages}
                                value={pageNumber}
                                onChange={handlePageInputChange}
                                className="px-4 py-2 border rounded-lg bg-primary text-text-primary"
                            />
                        </div> */}

                        <button
                            onClick={() => handlePageChange(pageNumber + 1)}
                            disabled={pageNumber === totalPages}
                            className="px-4 py-2 border rounded-lg bg-primary text-text-primary"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const HistoryPage = () => (
    <Suspense fallback={<div>Loading gallery...</div>}>
        <History />
    </Suspense>
);

export default HistoryPage;
