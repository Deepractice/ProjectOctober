import React, { useState } from 'react';
import { authenticatedFetch } from '../../utils/api';

function VersionUpgradeModal({
  isOpen,
  onClose,
  currentVersion,
  latestVersion,
  releaseInfo
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateOutput, setUpdateOutput] = useState('');
  const [updateError, setUpdateError] = useState('');

  if (!isOpen) return null;

  const cleanChangelog = (body) => {
    if (!body) return '';

    return body
      .replace(/\b[0-9a-f]{40}\b/gi, '')
      .replace(/(?:^|\s|-)([0-9a-f]{7,10})\b/gi, '')
      .replace(/\*\*Full Changelog\*\*:.*$/gim, '')
      .replace(/https?:\/\/github\.com\/[^\/]+\/[^\/]+\/compare\/[^\s)]+/gi, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  };

  const handleUpdateNow = async () => {
    setIsUpdating(true);
    setUpdateOutput('Starting update...\n');
    setUpdateError('');

    try {
      const response = await authenticatedFetch('/api/system/update', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setUpdateOutput(prev => prev + data.output + '\n');
        setUpdateOutput(prev => prev + '\n✅ Update completed successfully!\n');
        setUpdateOutput(prev => prev + 'Please restart the server to apply changes.\n');
      } else {
        setUpdateError(data.error || 'Update failed');
        setUpdateOutput(prev => prev + '\n❌ Update failed: ' + (data.error || 'Unknown error') + '\n');
      }
    } catch (error) {
      setUpdateError(error.message);
      setUpdateOutput(prev => prev + '\n❌ Update failed: ' + error.message + '\n');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close version upgrade modal"
      />

      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-4 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Update Available</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {releaseInfo?.title || 'A new version is ready'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Version</span>
            <span className="text-sm text-gray-900 dark:text-white font-mono">{currentVersion}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Latest Version</span>
            <span className="text-sm text-blue-900 dark:text-blue-100 font-mono">{latestVersion}</span>
          </div>
        </div>

        {releaseInfo?.body && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">What's New:</h3>
              {releaseInfo?.htmlUrl && (
                <a
                  href={releaseInfo.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
                >
                  View full release
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 max-h-64 overflow-y-auto">
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                {cleanChangelog(releaseInfo.body)}
              </div>
            </div>
          </div>
        )}

        {updateOutput && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Update Progress:</h3>
            <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 border border-gray-700 max-h-48 overflow-y-auto">
              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{updateOutput}</pre>
            </div>
          </div>
        )}

        {!isUpdating && !updateOutput && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Manual upgrade:</h3>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 border">
              <code className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                git checkout main && git pull && npm install
              </code>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Or click "Update Now" to run the update automatically.
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            {updateOutput ? 'Close' : 'Later'}
          </button>
          {!updateOutput && (
            <>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('git checkout main && git pull && npm install');
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Copy Command
              </button>
              <button
                onClick={handleUpdateNow}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-md transition-colors flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Now'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VersionUpgradeModal;
