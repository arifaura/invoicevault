import React, { useState, useEffect } from "react";
import {
  FiX,
  FiCoffee,
  FiCode,
  FiBookOpen,
  FiHeart,
  FiThumbsUp,
  FiThumbsDown,
} from "react-icons/fi";
import { getFeedbackCounts, submitFeedback, getUserVote } from "../../utils/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import "./UpgradeModal.css";

const UpgradeModal = ({ isOpen, onClose }) => {
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [currentVote, setCurrentVote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setIsInitialLoading(true);
      try {
        const counts = await getFeedbackCounts();
        if (!mounted) return;
        
        setLikes(counts.likes);
        setDislikes(counts.dislikes);

        if (user) {
          const userVote = await getUserVote(user.id);
          if (!mounted) return;
          setCurrentVote(userVote);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        if (mounted) {
          toast.error('Failed to load feedback data');
        }
      } finally {
        if (mounted) {
          setIsInitialLoading(false);
        }
      }
    };

    loadData();

    // Set up real-time subscription for vote updates
    const interval = setInterval(loadData, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user]);

  // Load initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsInitialLoading(true);
    }
  }, [isOpen]);

  const handleVote = async (type) => {
    if (!user) {
      toast.error('Please login to vote');
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);
      const result = await submitFeedback(type, user.id);

      // Update UI based on action
      switch (result.action) {
        case 'removed':
          if (type === 'like') {
            setLikes(prev => Math.max(0, prev - 1));
          } else {
            setDislikes(prev => Math.max(0, prev - 1));
          }
          setCurrentVote(null);
          toast.success('Vote removed');
          break;

        case 'changed':
          if (type === 'like') {
            setLikes(prev => prev + 1);
            setDislikes(prev => Math.max(0, prev - 1));
          } else {
            setDislikes(prev => prev + 1);
            setLikes(prev => Math.max(0, prev - 1));
          }
          setCurrentVote(type);
          toast.success('Vote updated');
          break;

        case 'added':
          if (type === 'like') {
            setLikes(prev => prev + 1);
          } else {
            setDislikes(prev => prev + 1);
          }
          setCurrentVote(type);
          toast.success('Thank you for your feedback!');
          break;
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="vote-counts">
              <div className="vote-count">
                <span className="count">{isInitialLoading ? '...' : likes}</span>
                <span className="label">Likes</span>
              </div>
              <div className="vote-count">
                <span className="count">{isInitialLoading ? '...' : dislikes}</span>
                <span className="label">Dislikes</span>
              </div>
            </div>
            <div className="vote-buttons animate-fade-in">
              <button 
                className={`vote-button like ${currentVote === 'like' ? 'voted' : ''} ${isLoading ? 'loading' : ''}`}
                onClick={() => handleVote('like')}
                disabled={isLoading || isInitialLoading}
              >
                <FiThumbsUp className="vote-icon" />
                <span>Like</span>
              </button>
              <button 
                className={`vote-button dislike ${currentVote === 'dislike' ? 'voted' : ''} ${isLoading ? 'loading' : ''}`}
                onClick={() => handleVote('dislike')}
                disabled={isLoading || isInitialLoading}
              >
                <FiThumbsDown className="vote-icon" />
                <span>Dislike</span>
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
