import React, { useState, useEffect } from "react";
import {
  FiX,
  FiBookOpen,
  FiBarChart2,
  FiTag,
  FiThumbsUp,
  FiThumbsDown,
  FiCheck,
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
        console.error("Error loading initial data:", error);
        if (mounted) {
          toast.error("Failed to load feedback data");
        }
      } finally {
        if (mounted) {
          setIsInitialLoading(false);
        }
      }
    };

    loadData();

    const interval = setInterval(loadData, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      setIsInitialLoading(true);
    }
  }, [isOpen]);

  const handleVote = async (type) => {
    if (!user) {
      toast.error("Please login to vote");
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);
      const result = await submitFeedback(type, user.id);

      switch (result.action) {
        case "removed":
          if (type === "like") {
            setLikes((prev) => Math.max(0, prev - 1));
          } else {
            setDislikes((prev) => Math.max(0, prev - 1));
          }
          setCurrentVote(null);
          toast.success("Vote removed");
          break;

        case "changed":
          if (type === "like") {
            setLikes((prev) => prev + 1);
            setDislikes((prev) => Math.max(0, prev - 1));
          } else {
            setDislikes((prev) => prev + 1);
            setLikes((prev) => Math.max(0, prev - 1));
          }
          setCurrentVote(type);
          toast.success("Vote updated");
          break;

        case "added":
          if (type === "like") {
            setLikes((prev) => prev + 1);
          } else {
            setDislikes((prev) => prev + 1);
          }
          setCurrentVote(type);
          toast.success("Thank you for your feedback!");
          break;

        default:
          break;
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const features = [
    {
      icon: <FiBookOpen />,
      title: "Smart notes",
      description: "Keep ideas and to-dos close to your work.",
    },
    {
      icon: <FiBarChart2 />,
      title: "Deeper insights",
      description: "See how your business is performing.",
    },
    {
      icon: <FiTag />,
      title: "Your own categories",
      description: "Organize invoices with custom tags.",
    },
  ];

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="upgrade-modal-overlay" onClick={handleOverlayClick}>
      <section
        className="upgrade-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="upgrade-modal-close"
          onClick={onClose}
          type="button"
          aria-label="Close upgrade modal"
        >
          <FiX size={20} />
        </button>

        <div className="upgrade-modal-hero">
          <div className="upgrade-modal-brand">
            <span className="upgrade-modal-brand-icon">
              <FiCheck aria-hidden="true" />
            </span>
            InvoiceVault <span className="upgrade-modal-brand-divider">/</span> Pro
          </div>
          <span className="upgrade-modal-status">Coming soon</span>
          <h2 id="upgrade-modal-title">
            Make room for
            <br />
            <span>what&apos;s next.</span>
          </h2>
          <p>
            We&apos;re building thoughtful tools to make managing your business
            feel a little easier.
          </p>
          <div className="upgrade-modal-preview">
            <FiCheck aria-hidden="true" />
            <span>More ways to stay on top of your business</span>
          </div>
        </div>

        <div className="upgrade-modal-main">
          <div className="upgrade-modal-section-heading">
            <div>
              <span className="upgrade-modal-eyebrow">A preview of Pro</span>
              <h3>Designed to work smarter with you</h3>
            </div>
            <span className="upgrade-modal-feature-count">3 features</span>
          </div>

          <div className="upgrade-modal-features">
            {features.map((feature) => (
              <article className="upgrade-modal-feature" key={feature.title}>
                <span className="upgrade-modal-feature-icon">{feature.icon}</span>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>

          <div className="upgrade-modal-feedback">
            <div className="upgrade-modal-feedback-copy">
              <span className="upgrade-modal-eyebrow">Help shape what&apos;s next</span>
              <p>Is this the kind of upgrade you&apos;d like to see?</p>
            </div>
            <div className="upgrade-modal-vote-buttons">
              <button
                className={`upgrade-modal-vote ${currentVote === "like" ? "is-voted" : ""}`}
                onClick={() => handleVote("like")}
                disabled={isLoading || isInitialLoading}
                type="button"
                aria-label={`Like this upgrade${isInitialLoading ? "" : `, ${likes} likes`}`}
                aria-pressed={currentVote === "like"}
              >
                <FiThumbsUp aria-hidden="true" />
                <span>{isInitialLoading ? "..." : likes}</span>
              </button>
              <button
                className={`upgrade-modal-vote ${currentVote === "dislike" ? "is-voted" : ""}`}
                onClick={() => handleVote("dislike")}
                disabled={isLoading || isInitialLoading}
                type="button"
                aria-label={`Dislike this upgrade${isInitialLoading ? "" : `, ${dislikes} dislikes`}`}
                aria-pressed={currentVote === "dislike"}
              >
                <FiThumbsDown aria-hidden="true" />
                <span>{isInitialLoading ? "..." : dislikes}</span>
              </button>
            </div>
          </div>

          <div className="upgrade-modal-footer">
            <span>Made with care for your business.</span>
            <button type="button" onClick={onClose}>
              Sounds good
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UpgradeModal;
