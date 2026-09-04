import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, Mic, Square, Users } from 'lucide-react';

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function CommunityChat({ token, user }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const listRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordStartRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      try {
        const response = await fetch('/chat/messages?limit=50', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Failed to load chat history');
        if (isMounted) setMessages(data.data || []);
      } catch (err) {
        if (isMounted) setError(err.message || 'Could not load chat history');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadHistory();

    const socket = io({ auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => {
      if (isMounted) setError('Unable to connect to the live chat channel.');
    });
    socket.on('new_message', (message) => {
      if (isMounted) setMessages((prev) => [...prev, message]);
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendText = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { type: 'text', content: inputText.trim() });
    setInputText('');
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recordStartRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const duration = Math.round((Date.now() - recordStartRef.current) / 1000);
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          socketRef.current?.emit('send_message', {
            type: 'voice',
            audio_base64: reader.result,
            duration
          });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setError('Microphone access denied or unavailable.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Global Community Chat</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Chat live with fellow travelers exploring Yaoundé
          </p>
        </div>
        <span className="badge badge-primary">
          <Users size={14} /> {connected ? 'Live' : 'Connecting...'}
        </span>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <div className="chat-page">
        <div className="chat-message-list" ref={listRef}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Loading chat history...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No messages yet. Say hello to the community!
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.user_id === user?.user_id;
              return (
                <div key={msg.id} className={`chat-bubble-row ${isOwn ? 'own' : ''}`}>
                  <div className="chat-bubble">
                    {!isOwn && <div className="chat-bubble-sender">{msg.username}</div>}
                    {msg.type === 'voice' ? (
                      <audio className="voice-player" controls src={msg.audio_url} />
                    ) : (
                      <div className="chat-bubble-text">{msg.content}</div>
                    )}
                    <div className="chat-bubble-time">{formatTime(msg.created_at)}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form className="chat-input-bar" onSubmit={handleSendText}>
          <button
            type="button"
            className={`voice-record-btn ${isRecording ? 'recording' : ''}`}
            onClick={handleToggleRecording}
            title={isRecording ? 'Stop recording' : 'Record voice message'}
          >
            {isRecording ? <Square size={18} /> : <Mic size={18} />}
          </button>
          <input
            type="text"
            className="input-control"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isRecording}
          />
          <button type="submit" className="btn btn-primary" disabled={!inputText.trim() || isRecording}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
