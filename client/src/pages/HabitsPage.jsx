import React, { useState, useEffect, useCallback } from 'react';
import { habitsApi } from '../services/api';
import { useToast } from '../hooks/useToast';

import HabitCard from '../components/HabitCard';
import HabitForm from '../components/HabitForm';
import ConfirmModal from '../components/ConfirmModal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

const HabitsPage = () => {
  const { addToast } = useToast();

  const [habits, setHabits] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletingHabit, setDeletingHabit] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHabits = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: 10,
        archived: activeTab === 'archived' ? 'true' : 'false',
      };

      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }

      const res = await habitsApi.getHabits(params);
      setHabits(res.data.habits || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message || 'Failed to load habits');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchHabits(1);
  }, [fetchHabits]);

  // Handle Create or Update
  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingHabit) {
        await habitsApi.updateHabit(editingHabit._id, formData);
        addToast('Habit updated successfully!', 'success');
      } else {
        await habitsApi.createHabit(formData);
        addToast('Habit created successfully!', 'success');
      }
      setIsFormOpen(false);
      setEditingHabit(null);
      fetchHabits(pagination.page);
    } catch (err) {
      addToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deletingHabit) return;
    setIsDeleting(true);
    try {
      await habitsApi.deleteHabit(deletingHabit._id);
      addToast('Habit and all completion history deleted.', 'info');
      setDeletingHabit(null);
      fetchHabits(1);
    } catch (err) {
      addToast(`Error deleting habit: ${err.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Manage Habits
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Configure goals, customize colors & emojis, or manage archives
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingHabit(null);
            setIsFormOpen(true);
          }}
        >
          <span>+</span> Add Habit
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div
        className="card"
        style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Search */}
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="search"
            className="form-input"
            placeholder="Search habits by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ margin: 0 }}
          />
        </div>

        {/* Active vs Archived Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'active' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('active')}
          >
            Active Habits
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'archived' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('archived')}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Content States */}
      {loading ? (
        <Loader message="Loading your habits..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchHabits(pagination.page)} />
      ) : habits.length === 0 ? (
        <EmptyState
          icon={activeTab === 'archived' ? '📦' : '🌱'}
          title={activeTab === 'archived' ? 'No archived habits' : 'No habits found'}
          description={
            searchQuery
              ? `No habits matched your search "${searchQuery}".`
              : activeTab === 'archived'
              ? 'Archived habits will be stored here.'
              : 'Create your first habit to begin tracking your consistency.'
          }
          actionLabel={activeTab === 'active' && !searchQuery ? 'Add Habit' : null}
          onAction={() => {
            setEditingHabit(null);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {habits.map((habit) => (
              <HabitCard
                key={habit._id}
                habit={habit}
                isManagement={true}
                onEdit={(h) => {
                  setEditingHabit(h);
                  setIsFormOpen(true);
                }}
                onDelete={(h) => setDeletingHabit(h)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '2rem',
              }}
            >
              <button
                className="btn btn-secondary btn-sm"
                disabled={!pagination.hasPrevPage}
                onClick={() => fetchHabits(pagination.page - 1)}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={!pagination.hasNextPage}
                onClick={() => fetchHabits(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Habit Form Modal */}
      <HabitForm
        isOpen={isFormOpen}
        initialData={editingHabit}
        onClose={() => {
          setIsFormOpen(false);
          setEditingHabit(null);
        }}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingHabit)}
        title="Delete Habit"
        message={`Are you sure you want to permanently delete "${deletingHabit?.name}"? All associated streak history and daily completions will be permanently erased.`}
        confirmLabel="Delete Habit"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingHabit(null)}
      />
    </div>
  );
};

export default HabitsPage;
