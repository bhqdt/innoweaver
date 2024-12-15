import React, { useState, useEffect, useCallback } from 'react';
import './MiniCard.css';
import { GetColor } from '@/lib/hooks/color';
import useRouterHook from '@/lib/hooks/router-hook';
import Link from 'next/link';
import { fetchLikeSolution } from '@/lib/actions';
import { FaHeart } from 'react-icons/fa';

const MiniCard = React.memo(function MiniCard(props: { content: any, index: number, isLiked: boolean }) {
    const { routes } = useRouterHook();
    const [isLiked, setIsLiked] = useState(false);
    const [imageError, setImageError] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        setIsLiked(props.isLiked);
    }, [props.isLiked]);

    const handleLiked = async (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        const newLikeStatus = !isLiked;
        setIsLiked(newLikeStatus);
        setIsLoading(true);
        setError('');

        try {
            const result = await fetchLikeSolution(props.content.id);
            console.log(result);
        } catch (err) {
            console.error('Error updating like status:', err);
            setIsLiked(!newLikeStatus);
            setError('Failed to update like status. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageError = useCallback(() => {
        setImageError(true);
    }, []);

    return (
        <div className="mini-card-container">
            <Link
                href={`/inspiration/${props.content.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="card"
                style={{
                    backgroundColor: GetColor(props.index, 50),
                }}
                aria-label={`View solution ${props.content.solution?.Title || 'Untitled'}`}
            >
                {!imageError && props.content.solution?.image_url ? (
                    <img
                        src={props.content.solution.image_url}
                        alt={props.content.solution.Title || 'Card Image'}
                        onError={handleImageError}
                        className="card-image"
                    />
                ) : (
                    <div className="image-placeholder">Image Not Available</div>
                )}

                <button
                    className="favorite-button"
                    style={{
                        color: isLiked ? '#ff6961' : '#BBBBBB',
                    }}
                    onClick={handleLiked}
                    onMouseDown={(e) => e.stopPropagation()}
                    aria-label={isLiked ? 'Unlike' : 'Like'}
                    disabled={isLoading}
                >
                    <FaHeart />
                </button>

                <div className="content">
                    <h2 className="function">
                        {props.content.solution?.Title || 'Untitled'}
                    </h2>
                    {error && <p className="error-message">{error}</p>}
                </div>
            </Link>
        </div>
    );
});

export default MiniCard;
MiniCard.whyDidYouRender = true;
