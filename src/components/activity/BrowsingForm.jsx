import { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { buildBrowsingSequence } from '../../protocols/sequenceBuilders';

export default function BrowsingForm() {
  const [url, setUrl] = useState('https://example.com');
  const { startActivity, isPlaying } = useSession();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    const steps = buildBrowsingSequence(url.trim());
    startActivity('browsing', steps, `🌐 Visiting ${url.trim()}`);
  };

  return (
    <form onSubmit={handleSubmit} id="browsing-form">
      <div className="form-group">
        <label className="form-label" htmlFor="browse-url">URL</label>
        <input
          type="text"
          id="browse-url"
          className="form-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          autoComplete="off"
        />
      </div>
      <button
        type="submit"
        className="btn btn-browsing btn-full"
        id="browse-submit"
        disabled={!url.trim()}
      >
        <span>🌐</span>
        <span>{isPlaying ? 'Restart Visit' : 'Visit Page'}</span>
      </button>
    </form>
  );
}
