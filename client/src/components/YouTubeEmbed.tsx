interface YouTubeEmbedProps {
  url: string;
  title: string;
}

export function YouTubeEmbed({ url, title }: YouTubeEmbedProps) {
  const getEmbedUrl = (videoUrl: string): string => {
    try {
      const urlObj = new URL(videoUrl);
      
      // Handle youtube.com/watch?v=VIDEO_ID
      if (urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/watch') {
        const videoId = urlObj.searchParams.get('v');
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
      
      // Handle youtube.com/playlist?list=PLAYLIST_ID
      if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('list')) {
        const playlistId = urlObj.searchParams.get('list');
        if (playlistId) {
          return `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
        }
      }
      
      // Handle youtu.be/VIDEO_ID
      if (urlObj.hostname === 'youtu.be') {
        const videoId = urlObj.pathname.slice(1);
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
      
      // Handle youtube.com/shorts/VIDEO_ID
      if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/shorts/')) {
        const videoId = urlObj.pathname.split('/shorts/')[1];
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
      
      return '';
    } catch (error) {
      console.error('Invalid YouTube URL:', videoUrl);
      return '';
    }
  };

  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">유효하지 않은 YouTube URL입니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg" data-testid="youtube-embed">
      <iframe
        className="w-full h-full"
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
