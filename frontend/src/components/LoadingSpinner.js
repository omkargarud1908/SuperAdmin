import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  text = "Loading", 
  showDots = true, 
  size = "medium",
  overlay = false 
}) => {
  const sizeClass = size === "small" ? "small" : size === "large" ? "large" : "medium";
  const overlayClass = overlay ? "overlay" : "";

  return (
    <div className={`loading-spinner-container ${overlayClass}`}>
      <div className="spinner-wrapper">
        <div className={`spinner ${sizeClass}`}></div>
      </div>
      <div className={`loading-text ${sizeClass}`}>
        {text}{showDots && <span className="loading-dots"></span>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
