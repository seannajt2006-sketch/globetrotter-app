import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Plus, Trash2, CheckCircle, AlertCircle, FileText, List } from 'lucide-react';

export default function CreateItinerary({ token, preselectedDestination, onItineraryCreated }) {
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activities, setActivities] = useState(['']);
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (preselectedDestination) {
      setDestination(`${preselectedDestination.name} - Yaounde`);
      if (!title) {
        setTitle(`Visit to ${preselectedDestination.name}`);
      }
    }
  }, [preselectedDestination]);

  const handleActivityChange = (index, value) => {
    const updated = [...activities];
    updated[index] = value;
    setActivities(updated);
  };

  const addActivityInput = () => {
    setActivities([...activities, '']);
  };

  const removeActivityInput = (index) => {
    if (activities.length > 1) {
      setActivities(activities.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!title.trim()) {
      setError('Trip title is required.');
      return;
    }

    if (!destination.trim()) {
      setError('Destination is required.');
      return;
    }

    const filteredActivities = activities.map((a) => a.trim()).filter((a) => a !== '');

    setLoading(true);

    try {
      const response = await fetch('/itineraries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          destination: destination.trim(),
          start_date: startDate,
          end_date: endDate,
          activities: filteredActivities,
          notes: notes.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create itinerary');
      }

      setSuccessMsg('Itinerary created successfully!');
      setTimeout(() => {
        if (onItineraryCreated) {
          onItineraryCreated(data.data);
        }
      }, 1000);
    } catch (err) {
      setError(err.message || 'Error communicating with backend server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
      <div className="card">
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar className="brand-icon" size={24} />
          <span>Plan a Visit in Yaounde</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Build your custom visit plan with dates, key activities, and notes.
        </p>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success">
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="it-title">Visit Title</label>
            <input
              id="it-title"
              type="text"
              className="input-control"
              placeholder="e.g. Weekend at Le Biniou"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="it-dest">Place / Location</label>
            <div style={{ position: 'relative' }}>
              <input
                id="it-dest"
                type="text"
                className="input-control"
                placeholder="e.g. Restaurant Le Biniou, Bastos"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="it-start">Start Date</label>
              <input
                id="it-start"
                type="date"
                className="input-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="it-end">End Date</label>
              <input
                id="it-end"
                type="date"
                className="input-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Planned Activities</span>
              <button
                type="button"
                onClick={addActivityInput}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <Plus size={14} /> Add Activity
              </button>
            </label>
            {activities.map((act, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  className="input-control"
                  placeholder={`Activity #${index + 1} (e.g. Try the safou platter)`}
                  value={act}
                  onChange={(e) => handleActivityChange(index, e.target.value)}
                />
                {activities.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 0.75rem', color: 'var(--danger)' }}
                    onClick={() => removeActivityInput(index)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="form-group">
            <label htmlFor="it-notes">Visit Notes</label>
            <textarea
              id="it-notes"
              className="textarea-control"
              placeholder="Reservation details, directions, what to bring, or reminders..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            <Plus size={18} />
            <span>{loading ? 'Saving Visit Plan...' : 'Create Visit Plan'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
