import React, { useState } from "react";
import {
  FiX,
  FiCoffee,
  FiCode,
  FiBookOpen,
  FiHeart,
  FiThumbsUp,
  FiThumbsDown,
} from "react-icons/fi";
import "./UpgradeModal.css";

const UpgradeModal = ({ isOpen, onClose }) => {
  const [likes, setLikes] = useState(128);
  const [dislikes, setDislikes] = useState(12);
  const [currentVote, setCurrentVote] = useState(null);

  if (!isOpen) return null;

  const features = [
    {
      icon: <FiBookOpen />,
      text: "Smart Notes Taking & Todo Lists",
    },
    {
      icon: <FiCoffee />,
      text: "Advanced Analytics Dashboard",
    },
    {
      icon: <FiCode />,
      text: "Custom Categories & Tags",
    },
  ];

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleVote = (type) => {
    if (currentVote === type) {
      // Unvote
      if (type === "like") {
        setLikes((prev) => prev - 1);
      } else {
        setDislikes((prev) => prev - 1);
      }
      setCurrentVote(null);
    } else {
      // Change vote
      if (currentVote === "like") {
        setLikes((prev) => prev - 1);
        setDislikes((prev) => prev + 1);
      } else if (currentVote === "dislike") {
        setDislikes((prev) => prev - 1);
        setLikes((prev) => prev + 1);
      } else {
        // New vote
        if (type === "like") {
          setLikes((prev) => prev + 1);
        } else {
          setDislikes((prev) => prev + 1);
        }
      }
      setCurrentVote(type);
    }
  };

  return (
    <div className="upgrade-modal-overlay" onClick={handleOverlayClick}>
      <div
        className="upgrade-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={onClose}>
          <FiX size={24} />
        </button>

        <div className="modal-header">
          <div className="header-content">
            <div className="stars">
              <span>⭐</span>
              <span>⭐</span>
              <span>⭐</span>
            </div>
            <h2 className="mt-1">Coming Soon!</h2>
          </div>
        </div>

        <div className="modal-body">
          <div className="message-container">
            <p className="main-message">Stay Tuned for Amazing Features</p>
            <div className="features-list">
              {features.map((feature, index) => (
                <div key={index} className="feature-item">
                  {feature.icon}
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="creator-message">
            <p>
              Created with <FiHeart className="heart-icon" /> by <b><i>Arif</i></b> {" "}
            </p>
            <p className="sub-message">
              More exciting features are on the way!
            </p>
          </div>

          <div className="feedback-section">
            <p className="feedback-title">Did you like our website?</p>
            <div className="vote-buttons animate-fade-in">
              <button
                className={`vote-button like ${
                  currentVote === "like" ? "voted" : ""
                }`}
                onClick={() => handleVote("like")}
              >
                <FiThumbsUp className="vote-icon" />
                <span>{likes}</span>
              </button>
              <button
                className={`vote-button dislike ${
                  currentVote === "dislike" ? "voted" : ""
                }`}
                onClick={() => handleVote("dislike")}
              >
                <FiThumbsDown className="vote-icon" />
                <span>{dislikes}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="notify-button">Notify Me When Available</button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
