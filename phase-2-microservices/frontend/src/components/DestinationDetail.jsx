import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Star, ThumbsUp, ThumbsDown, MessageCircle, Send } from 'lucide-react';

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function CommentItem({ comment, token, user, onReplyPosted, onVote, isReply = false }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await onReplyPosted(comment.id, replyText.trim());
      setReplyText('');
      setShowReplyForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comment-item">
      <div className="comment-header">
        <span className="comment-author">{comment.username}</span>
        <span className="comment-timestamp">{timeAgo(comment.created_at)}</span>
      </div>
      <p className="comment-text">{comment.text}</p>
      <div className="comment-actions">
        <div className="vote-buttons">
          <button
            className={`vote-btn ${comment.my_vote === 'up' ? 'active-up' : ''}`}
            onClick={() => onVote(comment.id, 'up')}
            disabled={!user}
            title={user ? 'Helpful' : 'Log in to vote'}
          >
            <ThumbsUp size={14} />
            <span>{comment.upvote_count}</span>
          </button>
          <button
            className={`vote-btn ${comment.my_vote === 'down' ? 'active-down' : ''}`}
            onClick={() => onVote(comment.id, 'down')}
            disabled={!user}
            title={user ? 'Not helpful' : 'Log in to vote'}
          >
            <ThumbsDown size={14} />
            <span>{comment.downvote_count}</span>
          </button>
        </div>

        {!isReply && user && (
          <button className="reply-toggle" onClick={() => setShowReplyForm(!showReplyForm)}>
            Reply
          </button>
        )}
      </div>

      {showReplyForm && (
        <form onSubmit={handleReplySubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
          <input
            type="text"
            className="input-control"
            placeholder={`Reply to ${comment.username}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={submitting || !replyText.trim()}>
            <Send size={16} />
          </button>
        </form>
      )}

      {comment.replies?.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              token={token}
              user={user}
              onReplyPosted={onReplyPosted}
              onVote={onVote}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DestinationDetail({ destination, token, user, onBack }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch(`/comments/${destination.id}`, { headers });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to load comments');
      }
      setComments(data.data || []);
    } catch (err) {
      setError(err.message || 'Error connecting to Community Service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination.id]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const response = await fetch(`/comments/${destination.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newComment.trim() })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to post comment');
      setNewComment('');
      await fetchComments();
    } catch (err) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const handleReplyPosted = async (commentId, text) => {
    const response = await fetch(`/comments/${commentId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text })
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Failed to post reply');
    await fetchComments();
  };

  const handleVote = async (commentId, vote) => {
    if (!user) return;
    try {
      const response = await fetch(`/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vote })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to record vote');
      await fetchComments();
    } catch (err) {
      setError(err.message || 'Failed to record vote');
    }
  };

  return (
    <div>
      <button className="btn btn-secondary" style={{ marginBottom: '1.2rem' }} onClick={onBack}>
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        {destination.image_url && (
          <div style={{ width: '100%', height: '260px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '1.2rem' }}>
            <img src={destination.image_url} alt={destination.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{destination.name}</h2>
          <span className="badge badge-accent">
            <Star size={12} fill="currentColor" /> {destination.rating || '4.0'}
          </span>
        </div>

        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <MapPin size={16} /> {destination.address || 'Yaoundé'}
        </div>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
          {destination.description}
        </p>

        {destination.tags?.length > 0 && (
          <div className="chip-group">
            {destination.tags.map((t) => (
              <span key={t} className="chip">#{t}</span>
            ))}
          </div>
        )}

        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Est. Daily Cost</span>
          <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '1.1rem' }}>
            {destination.cost_per_day > 0 ? `${destination.cost_per_day.toLocaleString()} XAF` : 'Free'}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <MessageCircle size={20} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Comments ({comments.length})</h3>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {user ? (
          <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <input
              type="text"
              className="input-control"
              placeholder="Share your experience..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={posting || !newComment.trim()}>
              <Send size={16} />
              <span>Post</span>
            </button>
          </form>
        ) : (
          <div className="alert" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
            <span>Log in to post a comment.</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No comments yet. Be the first to share your experience!
          </div>
        ) : (
          <div className="comment-thread">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                token={token}
                user={user}
                onReplyPosted={handleReplyPosted}
                onVote={handleVote}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
