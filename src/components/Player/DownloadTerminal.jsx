import { useState } from 'react';
import { Terminal } from 'lucide-react';
import './DownloadTerminal.css';

const DownloadTerminal = ({ animeTitle, episode, downloadUrl }) => {
  const [copied, setCopied] = useState(false);

  const epNum = episode?.toString().padStart(2, '0') ?? '--';
  const status = '200 OK';
  const statusColor = '#0f0';

  // Copiar al portapapeles al hacer click en el link
  const handleCopy = () => {
    if (!downloadUrl) return;
    navigator.clipboard.writeText(downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="download-terminal glass terminal-hacker">
      {/* Barra superior tipo MacOS */}
      <div className="terminal-header">
        <div className="terminal-controls">
          <span className="terminal-dot red"></span>
          <span className="terminal-dot yellow"></span>
          <span className="terminal-dot green"></span>
        </div>
        <div className="terminal-title">
          <Terminal size={16} />
          <span>&nbsp;DOWNLOAD_TERMINAL.exe</span>
        </div>
        <div className="terminal-status">
          <span className="status-indicator active"></span>
          <span>ONLINE</span>
        </div>
      </div>
      <div className="terminal-body">
        <pre className="terminal-log">
{`---------------------------------------
        EPISODE DATABASE
---------------------------------------

TITLE:  ${animeTitle || '--'}
EPISODE: ${epNum}
STATUS:  `}
<span className="terminal-status-ok">{status}</span>
{`

DOWNLOAD LINK: 
`}
{downloadUrl ? (
  <span
    className="terminal-link"
    onClick={handleCopy}
    tabIndex={0}
    title="Click to copy"
  >
    {downloadUrl}
  </span>
) : (
  <span className="terminal-no-link">No download link available</span>
)}
{`

---------------------------------------
root@animeOS:~$ _`}
        </pre>
        {copied && (
          <div className="terminal-toast">Copied!</div>
        )}
      </div>
    </div>
  );
};

export default DownloadTerminal;
