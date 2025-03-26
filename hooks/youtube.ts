import { Bookmarks } from "wxt/browser";

export function toYoutubePlaylist(items: Bookmarks.BookmarkTreeNode[]): {
    result: string[],
    success: number,
    error: number,
    message: string
} {
    // Track statistics
    let filteredCount = 0;
    let successCount = 0;
    let errorCount = 0;

    // Filter only links on youtube domain (allow music.youtube.com)
    const youtubeLinks = items.filter(item => {
        if (!item.url) {
            console.error('Error: Bookmark item has no URL', item);
            errorCount++;
            return false;
        }

        const isYoutubeLink = item.url.includes('youtube.com/watch') ||
            item.url.includes('youtu.be/');

        if (isYoutubeLink) {
            filteredCount++;
            return true;
        } else {
            console.error('Skipped non-YouTube link:', item.url);
            errorCount++;
            return false;
        }
    });

    // Extract video IDs from URLs
    const youtubeIds = youtubeLinks.map(item => {
        try {
            const url = new URL(item.url || '');

            // Handle youtu.be short links
            if (url.hostname === 'youtu.be') {
                const id = url.pathname.substring(1); // Remove leading slash
                if (id) {
                    successCount++;
                    return id;
                }
            }

            // Handle regular youtube.com links
            const id = url.searchParams.get('v');
            if (id) {
                successCount++;
                return id;
            } else {
                // If we get here, couldn't extract an ID
                console.error("Invalid YouTube link:", item.url);
                errorCount++;
                return '';
            }
        } catch (e) {
            console.error("Error extracting YouTube ID:", e);
            errorCount++;
            return '';
        }
    }).filter(id => id !== ''); // Remove any empty IDs

    // Group IDs into chunks of 50 (YouTube's limit per playlist URL)
    const idChunks = [];
    for (let i = 0; i < youtubeIds.length; i += 50) {
        idChunks.push(youtubeIds.slice(i, i + 50));
    }

    // Create playlist URLs for each chunk
    const playlistUrls = idChunks.map(chunk =>
        `https://www.youtube.com/watch_videos?video_ids=${chunk.join(',')}`
    );

    // Create appropriate message
    let message = '';
    if (playlistUrls.length === 0) {
        message = 'Error: No valid YouTube video IDs found.';
    } else if (playlistUrls.length === 1) {
        message = `Created 1 playlist URL with ${youtubeIds.length} videos.`;
    } else {
        message = `Created ${playlistUrls.length} playlist URLs with ${youtubeIds.length} videos total.`;
    }

    if (errorCount > 0) {
        message += ` (${errorCount} invalid links skipped)`;
    }

    return {
        result: playlistUrls,
        success: successCount,
        error: errorCount,
        message: message
    };
}