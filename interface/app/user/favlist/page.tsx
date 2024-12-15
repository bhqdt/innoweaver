"use client";

import { useState, useEffect } from 'react';
import { fetchLoadLikedSolutions } from "@/lib/actions";
import GalleryPage from '@/comp/solution/GalleryPage';

const FavList = () => {
    const [id, setId] = useState('');

    useEffect(() => {
        const storedId = localStorage.getItem("id");
        if (storedId) {
            setId(storedId);
        }
    }, []);

    return (
        <div className="flex justify-center bg-primary text-text-primary font-sans min-h-full transition-colors duration-300"
            style={{ height: '100vh' }}>
            <GalleryPage title="My Favorite" fetchData={fetchLoadLikedSolutions} />
        </div>
    );
};

export default FavList;
