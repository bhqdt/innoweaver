'use client'

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { MeiliSearch } from "meilisearch";
import Link from "next/link";
import { motion, AnimatePresence } from 'framer-motion';

const sortPaper = (paperData) => {
    const orderedData = {};
    const primaryFields = ["id", "Title", "Author", "DOI", "Keywords", "Series"];
    primaryFields.forEach((key) => {
        if (key in paperData) {
            orderedData[key] = paperData[key];
            delete paperData[key];
        }
    });
    return { ...orderedData, ...paperData };
};

const Metadata = ({ data }) => {
    const { Title, Author, Keywords, DOI, Cited, Series } = data;
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-primary p-6 rounded-lg shadow-lg mb-6"
        >
            <h2 className="text-lg font-semibold text-text-primary mb-4">
                {Title || "Paper Information"}
            </h2>
            <div className="flex flex-col gap-2 text-text-secondary">
                {Author && <p><strong>Author:</strong> {Author}</p>}
                {Keywords && <p><strong>Keywords:</strong> {Keywords}</p>}
                {DOI && (
                    <p>
                        <strong>DOI:</strong>
                        <Link href={`https://doi.org/${DOI}`} target="_blank" className="text-blue-400 underline ml-1">
                            {DOI}
                        </Link>
                    </p>
                )}
                {Cited && <p><strong>Cited:</strong> {Cited}</p>}
                {Series && <p><strong>Series:</strong> {Series}</p>}
            </div>
        </motion.div>
    );
};

const JsonNode = ({ keyName, value, isFirst = true }) => {
    const displayKey = !isFirst && isNaN(Number(keyName)) ? `${keyName}:` : null;
    const isExpandable = typeof value === "object" && value !== null;
    const isIdLink = keyName === "_id";

    const renderValue = () => {
        if (isIdLink) {
            return (
                <Link href={`/paper/${value}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                    {value}
                </Link>
            );
        }
        return <span className="text-ellipsis overflow-hidden">{value}</span>;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col mt-3 text-text-secondary"
        >
            <div className="flex items-start">
                {displayKey && <strong className="whitespace-nowrap mr-2">{displayKey}</strong>}
                {!isExpandable && renderValue()}
            </div>
            {isExpandable && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="ml-5 border-l-2 border-border-secondary pl-4 mt-1"
                >
                    {Array.isArray(value)
                        ? value.map((item, index) => <JsonNode key={index} keyName={index} value={item} isFirst={false} />)
                        : Object.entries(value).map(([subKey, subValue]) => (
                            <JsonNode key={subKey} keyName={subKey} value={subValue} isFirst={false} />
                        ))}
                </motion.div>
            )}
        </motion.div>
    );
};

const Paper = () => {
    const apiUrl = '120.55.193.195:7700/';
    const { id } = useParams();
    const [paper, setPaper] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const client = useMemo(() => new MeiliSearch({ host: apiUrl }), [apiUrl]);

    const fetchPaperDetails = useCallback(async () => {
        const index = client.index("paper_id");
        try {
            setLoading(true);
            const searchResults = await index.search(id as string, { limit: 1 });
            if (searchResults.hits.length > 0) {
                setPaper(sortPaper(searchResults.hits[0]));
            } else {
                setError("Paper not found");
            }
        } catch (err) {
            console.error("Error fetching paper:", err);
            setError("Error fetching paper");
        } finally {
            setLoading(false);
        }
    }, [id, client]);

    useEffect(() => {
        fetchPaperDetails();
    }, [fetchPaperDetails]);

    const renderOrderedJson = (data) => {
        const orderedKeys = ["Target Definition", "Artifact Knowledge", "Results", "Contributions", "Second Extraction"];
        return orderedKeys.map((key, index) => (
            data[key] && (
                <motion.div
                    key={key}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                    className="bg-primary p-8 mb-8 rounded-lg shadow-lg"
                >
                    <h2 className="text-xl font-semibold text-text-primary mb-6 border-b border-border-secondary pb-2">
                        {key.replace(/_/g, " ")}
                    </h2>
                    <JsonNode keyName={key} value={data[key]} />
                </motion.div>
            )
        ));
    };

    return (
        <div className="flex flex-col ml-[12.5rem] items-center bg-primary">
            <AnimatePresence>
                {loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-center items-center min-h-screen"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full"
                        />
                    </motion.div>
                ) : error ? (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="flex justify-center items-center min-h-screen"
                    >
                        <div className="text-center text-red-500">{error}</div>
                    </motion.div>
                ) : paper ? (
                    <motion.div
                        key="paper"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex text-text-primary min-h-screen"
                    >
                        <div className="w-full max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 overflow-y-auto">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                            >
                                <Metadata data={paper} />
                            </motion.div>
                            {renderOrderedJson(paper)}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
};

export default Paper;

