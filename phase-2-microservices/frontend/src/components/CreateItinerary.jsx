import React, { useState, useEffect } from 'react';
import { PlusCircle, MapPin, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CreateItinerary({ token, preselectedDestination, onItineraryCreated }) {
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activitiesStr, setActivitiesStr] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (preselectedDestination) {
      setDestination(preselectedDestination.name || preselectedDestination.address || '');
      setTitle(`Visit to ${preselectedDestination.name}`);
      if (preselectedDestination.description) {
        setNotes(`Highlighted spot: ${preselectedDestination.description}`);
      }
    }
  }, [preselectedDestination]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!title.trim() || !destination.trim()) {
      setError('Title and destination are required.');
      return;
    }

    const activities = activitiesStr
      .split('\n')
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

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
          activities,
          notes: notes.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create itinerary');
      }

      setSuccess(true);
      setTimeout(() => {
        onItineraryCreated();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Error connecting to Itinerary Service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '1.5rem auto', width: '100%' }}>
      <div className="card">
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', pb: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <PlusCircle style={{ color: 'var(--primary)' }} size={24} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Plan a New Visit</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Create an itinerary stop or multi-day trip in Yaoundé
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle2 size={18} />
            <span>Itinerary created successfully! Event published to RabbitMQ.</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="trip-title">Itinerary Title *</label>
            <input
              id="trip-title"
              type="text"
              className="input-control"
              placeholder="e.g. Bastos Culinary Tour"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="trip-destination">Destination / Location *</label>
            <input
              id="trip-destination"
              type="text"
              className="input-control"
              placeholder="e.g. Restaurant Le Biniou, Bastos"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="start-date">Start Date</label>
              <input
                id="start-date"
                type="date"
                className="input-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="end-date">End Date</label>
              <input
                id="end-date"
                type="date"
                className="input-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="activities">Planned Activities (One per line)</label>
            <textarea
              id="activities"
              className="textarea-control"
              placeholder="e.g.&#10;Dinner at Bastos&#10;Visit Central Market&#10;Walk in Mvog-Betsi Botanical Garden"
              value={activitiesStr}
              onChange={(e) => setActivitiesStr(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes / Reminders</label>
            <textarea
              id="notes"
              className="textarea-control"
              placeholder="Packing reminders, transportation notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.8rem' }}
            disabled={loading}
          >
            <PlusCircle size={18} />
            <span>{loading ? 'Creating Trip...' : 'Save & Publish Itinerary'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
