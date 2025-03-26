import { useNavigate } from "react-router-dom";
import { useAppContext } from "../AppProvider";

// URL input view component
export default function UrlInputView() {
    const navigate = useNavigate();
    const {
      urlList,
      setUrlList,
      parseUrls,
      parsedUrls,
      showSuccess,
      showError,
      bookmarkSuccess,
      bookmarkOperations,
      setFolderSelectHandler,
    } = useAppContext();
  
    const handleUrlInputSubmit = useCallback(() => {
      if (parseUrls()) {
        setFolderSelectHandler((ids) => {
            bookmarkOperations.handlers.handleAddUrlsAsBookmarks(
                ids, 
                {
                    items: parsedUrls,
                    onSuccess: () => {
                        setUrlList('');
                        navigate('/');
                    }
                }
            );
        });
        navigate('/folder-selector');
      } else {
        showError("Failed to parse URLs");
      }
    }, [parseUrls, showSuccess, bookmarkOperations.handlers.handleAddUrlsAsBookmarks, navigate]);
  
    const handleUrlInputCancel = useCallback(() => {
      navigate('/');
    }, [navigate]);
  
    return (
      <>
        {bookmarkSuccess && <StatusMessage message={bookmarkSuccess} />}
        <UrlInput
          urlList={urlList}
          setUrlList={setUrlList}
          onCancel={handleUrlInputCancel}
          onSubmit={handleUrlInputSubmit}
        />
      </>
    );
  }