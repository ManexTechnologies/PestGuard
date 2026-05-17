import React, { useEffect, useState } from 'react';
import './LoadingProgressBar.css';

interface LoadingProgressBarProps {
  message?: string;
  isLoading: boolean;
  fullScreen?: boolean;
}

/**
 * Professional loading progress bar component with elegant animation
 * Follows the app's green theme and glassmorphism design
 */
const LoadingProgressBar: React.FC<LoadingProgressBarProps> = ({
  message = 'Loading your pest reports…',
  isLoading,
  fullScreen = false,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      const timer = setTimeout(() => setProgress(0), 300);
      return () => clearTimeout(timer);
    }

    setProgress(10);
    let currentProgress = 10;

    // Simulate progress with exponential backoff
    const interval = setInterval(() => {
      const increment = Math.random() * (25 - currentProgress / 10);
      currentProgress = Math.min(currentProgress + increment, 90);
      setProgress(currentProgress);
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading && progress === 0) {
    return null;
  }

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50'
    : 'relative';

  const contentClasses = fullScreen
    ? 'fixed inset-0 flex flex-col items-center justify-center z-50 bg-black/20 backdrop-blur-md'
    : '';

  return (
    <div className={containerClasses}>
      {fullScreen && <div className={contentClasses} />}
      <div
        className={`${
          fullScreen
            ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50'
            : ''
        } w-full max-w-md loading-progress-container`}
      >
        <div className="loading-progress-card">
          {/* Header */}
          <div className="space-y-2">
            <h3 className="loading-progress-title">
              {message}
            </h3>
            <p className="loading-progress-percentage">
              {Math.round(progress)}%
            </p>
          </div>

          {/* Progress Bar */}
          <div className="loading-progress-bar-container">
            <div
              className="loading-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Animated dots under progress bar */}
          <div className="loading-progress-dots">
            {[0, 1, 2].map((dot) => (
              <div
                key={dot}
                className="loading-progress-dot"
              />
            ))}
          </div>

          {/* Subtle text */}
          <p className="loading-progress-subtitle">
            Please wait...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingProgressBar;
