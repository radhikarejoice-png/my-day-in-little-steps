import React, { useState, useEffect, useRef, useMemo } from 'react';
import './App.css';

import { NURSERY_INFO, INITIAL_CHILDREN, INITIAL_ACTIVITIES } from './data/initialData';
import { useToast } from './hooks/useToast';
import {
  fetchChildrenFromSupabase,
  insertChildToSupabase,
  updateChildInSupabase,
  deleteChildFromSupabase,
} from './services/childrenService';

import ProgressBar from './components/ProgressBar';
import ToastContainer from './components/ToastContainer';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import QuickActions from './components/QuickActions';
import ChildSearchFilter from './components/ChildList/ChildSearchFilter';
import ChildCard from './components/ChildList/ChildCard';
import AddChildModal from './components/ChildList/AddChildModal';
import ActivityFeed from './components/ActivityFeed';
import Footer from './components/Footer';

import ChildWorkspace from './components/ChildWorkspace/ChildWorkspace';
import ParentView from './components/ParentView/ParentView';
import ActivityLibrary from './components/ActivityLibrary/ActivityLibrary';
import SettingsView from './components/Settings/SettingsView';

function App() {
  // State management
  const [childrenList, setChildrenList] = useState(INITIAL_CHILDREN);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [currentNav, setCurrentNav] = useState('dashboard');
  const [selectedChildWorkspace, setSelectedChildWorkspace] = useState(null);
  const [demoRole, setDemoRole] = useState('educator');

  // Nursery Info state initialized from localStorage with fallback to NURSERY_INFO
  const [nurseryInfo, setNurseryInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('mylittlesteps_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load settings from localStorage:', e);
    }
    return NURSERY_INFO;
  });

  // Load children from Supabase on mount (falls back to INITIAL_CHILDREN if not configured)
  useEffect(() => {
    let isMounted = true;
    async function loadChildren() {
      const result = await fetchChildrenFromSupabase();
      if (isMounted && result.data && result.data.length > 0) {
        setChildrenList(result.data);
      }
    }
    loadChildren();
    return () => {
      isMounted = false;
    };
  }, []);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Modal state
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [editingChild, setEditingChild] = useState(null);

  // Action progress bar state
  const [progressActive, setProgressActive] = useState(false);
  const [progressVal, setProgressVal] = useState(0);

  // Toast notifications hook
  const { toasts, addToast, removeToast } = useToast();

  // Trigger smooth progress animation
  const triggerProgressBar = (callback) => {
    setProgressActive(true);
    setProgressVal(35);
    setTimeout(() => {
      setProgressVal(85);
      setTimeout(() => {
        setProgressVal(100);
        setTimeout(() => {
          setProgressActive(false);
          setProgressVal(0);
          if (callback) callback();
        }, 250);
      }, 150);
    }, 100);
  };

  const isSearching = Boolean(searchQuery.trim());

  // Filtered children:
  // If searching: search across all children by name or class
  // If not searching: show only children needing attention (max 4)
  const displayedChildren = useMemo(() => {
    if (isSearching) {
      const q = searchQuery.toLowerCase().trim();
      return childrenList.filter((child) => {
        const matchesName = child.name.toLowerCase().includes(q);
        const matchesGroup = (child.groupName || '').toLowerCase().includes(q);
        return matchesName || matchesGroup;
      });
    }

    // Default "Needs Attention Today" view:
    // Show only children who currently require educator action, limited to max 4 cards
    const needsAttention = childrenList.filter((child) => {
      return (
        child.scheduleStatus === 'not-created' ||
        child.scheduleStatus === 'to-prepare' ||
        child.scheduleStatus === 'in-progress' ||
        child.scheduleStatus === 'home-update'
      );
    });

    return needsAttention.slice(0, 4);
  }, [childrenList, isSearching, searchQuery]);

  // Add / Edit Child Handler
  const handleSaveChild = async (childData, isEdit) => {
    triggerProgressBar();

    if (isEdit) {
      const result = await updateChildInSupabase(childData);

      if (result.success && result.data) {
        // Update child immediately in React state
        setChildrenList((prev) =>
          prev.map((c) => (c.id === result.data.id ? { ...c, ...result.data } : c))
        );

        if (selectedChildWorkspace && selectedChildWorkspace.id === result.data.id) {
          setSelectedChildWorkspace(result.data);
        }

        // Add activity entry
        const newAct = {
          id: 'act-' + Date.now(),
          childName: result.data.name,
          actionText: 'Child updated',
          timeAgo: 'Just now',
          icon: '✏️',
          bg: '#E8F5E9',
        };
        setActivities((prev) => [newAct, ...prev]);

        addToast({
          title: `${result.data.name} Updated`,
          message: 'Child updated successfully.',
          icon: '✏️',
          type: 'success',
        });

        return { success: true, data: result.data };
      } else {
        // Supabase update failed: do NOT update child locally
        console.error('Failed to update child in Supabase:', result.error);

        addToast({
          title: 'Failed to Update Child',
          message: result.error?.message || 'Could not update child in Supabase. Please try again.',
          icon: '⚠️',
          type: 'error',
        });

        return { success: false, error: result.error };
      }
    } else {
      // Add Child to Supabase
      const result = await insertChildToSupabase(childData);

      if (result.success && result.data) {
        // Immediately refresh homepage child state
        setChildrenList((prev) => [result.data, ...prev]);

        // Add activity entry
        const newAct = {
          id: 'act-' + Date.now(),
          childName: result.data.name,
          actionText: 'Child enrolled',
          timeAgo: 'Just now',
          icon: '✨',
          bg: '#E1F5FE',
        };
        setActivities((prev) => [newAct, ...prev]);

        // Show toast: "Child added successfully."
        addToast({
          title: 'Child Added',
          message: 'Child added successfully.',
          icon: result.data.avatarEmoji || '✨',
          type: 'success',
        });

        return { success: true, data: result.data };
      } else {
        // Supabase insert failed: do NOT add child locally
        console.error('Failed to insert child into Supabase:', result.error);

        addToast({
          title: 'Failed to Add Child',
          message: result.error?.message || 'Could not save child to Supabase. Please try again.',
          icon: '⚠️',
          type: 'error',
        });

        return { success: false, error: result.error };
      }
    }
  };

  // Open Child Handler: navigate to child workspace
  const handleOpenChild = (child) => {
    triggerProgressBar();
    setSelectedChildWorkspace(child);
    addToast({
      title: `Workspace: ${child.name}`,
      message: `Opened ${child.name}'s daily visual schedule.`,
      icon: child.avatarEmoji || '👶',
      type: 'info',
    });
  };

  // Edit Child Handler
  const handleEditChild = (child) => {
    setEditingChild(child);
    setIsAddChildOpen(true);
  };

  // Delete Child Handler
  const handleDeleteChild = async (childId, childName) => {
    triggerProgressBar();

    const result = await deleteChildFromSupabase(childId);

    if (result.success) {
      // Remove child immediately from React state
      setChildrenList((prev) => prev.filter((c) => c.id !== childId));

      // If deleted child was currently open in workspace, navigate back to dashboard
      if (selectedChildWorkspace && selectedChildWorkspace.id === childId) {
        setSelectedChildWorkspace(null);
      }

      // Add activity entry
      const newAct = {
        id: 'act-' + Date.now(),
        childName: childName || 'Child',
        actionText: 'Child deleted',
        timeAgo: 'Just now',
        icon: '🗑️',
        bg: '#FEE2E2',
      };
      setActivities((prev) => [newAct, ...prev]);

      // Show toast: "Child deleted successfully."
      addToast({
        title: `${childName || 'Child'} Deleted`,
        message: 'Child deleted successfully.',
        icon: '🗑️',
        type: 'success',
      });

      return { success: true };
    } else {
      // Supabase delete failed: do NOT remove child locally
      console.error('Failed to delete child from Supabase:', result.error);

      addToast({
        title: 'Failed to Delete Child',
        message: result.error?.message || 'Could not delete child from Supabase. Please try again.',
        icon: '⚠️',
        type: 'error',
      });

      return { success: false, error: result.error };
    }
  };

  // Focus Search
  const handleFocusSearch = () => {
    triggerProgressBar();
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Stat Card click handler
  const handleStatCardClick = (card) => {
    triggerProgressBar();
    addToast({
      title: card.value,
      message: card.subtitle,
      icon: card.icon,
      type: 'info',
    });
  };

  // Quick Action Handlers
  const handleFilterSchedulesToPrepare = () => {
    triggerProgressBar();
    setSearchQuery('to-prepare');
    addToast({
      title: 'Schedules to Prepare',
      message: 'Filtered to schedules needing educator preparation.',
      icon: '⏳',
      type: 'info',
    });
  };

  const handleFilterHomeUpdates = () => {
    triggerProgressBar();
    setSearchQuery('home');
    addToast({
      title: 'Home Updates',
      message: 'Filtered to updates awaiting parent response.',
      icon: '🏡',
      type: 'info',
    });
  };

  const handleOpenActivityLibrary = () => {
    triggerProgressBar();
    setSelectedChildWorkspace(null);
    setCurrentNav('library');
    addToast({
      title: 'Activity Library',
      message: 'Visual routine & home activity cards available.',
      icon: '📚',
      type: 'info',
    });
  };

  // Settings Save Handler
  const handleSaveSettings = (updatedNurseryInfo, role) => {
    triggerProgressBar();
    setNurseryInfo(updatedNurseryInfo);
    if (role) {
      setDemoRole(role);
      if (role === 'parent') {
        setCurrentNav('parent-view');
      }
    }
    try {
      localStorage.setItem('mylittlesteps_settings', JSON.stringify(updatedNurseryInfo));
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e);
    }
  };

  return (
    <div className="app-container">
      {/* Top Animated Progress Bar */}
      <ProgressBar isActive={progressActive} progress={progressVal} />

      {/* HTML Floating Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Sticky Left Navigation Sidebar with Hover Tooltips */}
      <Sidebar
        currentNav={currentNav}
        onNavSelect={(navId, label) => {
          triggerProgressBar();
          setSelectedChildWorkspace(null);
          setCurrentNav(navId);
          if (navId !== 'dashboard') {
            addToast({
              title: `${label} View`,
              message: `Switched view to ${label}.`,
              icon: '📌',
              type: 'info',
            });
          }
        }}
      />

      {/* Main Workspace: Activity Library, Settings, Parent View, Child Workspace, or Homepage Dashboard */}
      <main className="dashboard-main">
        {currentNav === 'library' ? (
          <ActivityLibrary
            onBackToDashboard={() => {
              triggerProgressBar();
              setCurrentNav('dashboard');
            }}
            onTriggerToast={addToast}
            onTriggerProgressBar={triggerProgressBar}
          />
        ) : currentNav === 'settings' ? (
          <SettingsView
            nurseryInfo={nurseryInfo}
            onSaveSettings={handleSaveSettings}
            onBackToDashboard={() => {
              triggerProgressBar();
              setCurrentNav('dashboard');
            }}
            onTriggerToast={addToast}
            onTriggerProgressBar={triggerProgressBar}
            demoRole={demoRole}
            onRoleChange={(role) => {
              setDemoRole(role);
              if (role === 'parent') {
                setCurrentNav('parent-view');
              }
            }}
          />
        ) : currentNav === 'home-activities' || currentNav === 'parent-view' ? (
          <ParentView
            child={selectedChildWorkspace || childrenList.find((c) => c.name === 'Adam') || childrenList[0]}
            onBackToDashboard={() => {
              triggerProgressBar();
              setCurrentNav('dashboard');
            }}
            onTriggerToast={addToast}
            onTriggerProgressBar={triggerProgressBar}
          />
        ) : selectedChildWorkspace ? (
          <ChildWorkspace
            child={selectedChildWorkspace}
            onBackToDashboard={() => {
              triggerProgressBar();
              setSelectedChildWorkspace(null);
            }}
            onEditChild={handleEditChild}
            onTriggerToast={addToast}
            onTriggerProgressBar={triggerProgressBar}
          />
        ) : (
          <>
            {/* Header with Nursery Info, Educator View & Add Child CTA */}
            <Header
              nurseryInfo={nurseryInfo}
              onOpenAddChild={() => {
                setEditingChild(null);
                setIsAddChildOpen(true);
              }}
              onQuickSearchFocus={handleFocusSearch}
              onSwitchToParentView={() => {
                triggerProgressBar();
                setCurrentNav('home-activities');
                addToast({
                  title: 'Parent View',
                  message: 'Switched to Parent View role demonstration.',
                  icon: '🏡',
                  type: 'info',
                });
              }}
            />

            {/* Today at a Glance: Exactly 4 Cards */}
            <StatsOverview onStatClick={handleStatCardClick} />

            {/* Quick Actions: Exactly 4 Actions */}
            <QuickActions
              onFilterSchedulesToPrepare={handleFilterSchedulesToPrepare}
              onFilterHomeUpdates={handleFilterHomeUpdates}
              onOpenActivityLibrary={handleOpenActivityLibrary}
              onOpenAddChild={() => {
                setEditingChild(null);
                setIsAddChildOpen(true);
              }}
            />

            {/* Search & "Needs Attention Today" Section */}
            <section className="children-section" aria-label="Needs Attention Today">
              <div className="section-header-inline">
                <div className="section-title-group">
                  <span className="section-icon">⚠️</span>
                  <h2 className="section-heading">Needs Attention Today</h2>
                </div>
                {!isSearching && (
                  <span className="section-hint">
                    Showing top 4 children requiring educator action
                  </span>
                )}
              </div>

              <ChildSearchFilter
                searchQuery={searchQuery}
                onSearchChange={(query) => setSearchQuery(query)}
                childrenCount={displayedChildren.length}
                isSearching={isSearching}
                searchRef={searchInputRef}
                onClearSearch={() => setSearchQuery('')}
              />

              {/* Child Cards Grid (Max 4 when not searching, or matching search results) */}
              <div className="children-cards-grid">
                {displayedChildren.length > 0 ? (
                  displayedChildren.map((child) => (
                    <ChildCard
                      key={child.id}
                      child={child}
                      onOpenChild={handleOpenChild}
                      onEditChild={handleEditChild}
                    />
                  ))
                ) : (
                  <div className="glass-panel activity-empty-state" style={{ gridColumn: '1 / -1' }}>
                    <span className="empty-icon">🔍</span>
                    <h3>No matching children found</h3>
                    <p>Try a different search term to find children by name or class.</p>
                    <button
                      type="button"
                      className="btn-modal-cancel"
                      style={{ marginTop: '0.75rem' }}
                      onClick={() => setSearchQuery('')}
                    >
                      Clear Search
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Recent Nursery Activity Stream */}
            <ActivityFeed activities={activities} />
          </>
        )}

        {/* Footer */}
        <Footer nurseryInfo={nurseryInfo} />
      </main>

      {/* Add / Edit Child Modal */}
      {isAddChildOpen && (
        <AddChildModal
          key={editingChild ? editingChild.id : 'new-child'}
          isOpen={isAddChildOpen}
          onClose={() => {
            setIsAddChildOpen(false);
            setEditingChild(null);
          }}
          onSaveChild={handleSaveChild}
          onDeleteChild={handleDeleteChild}
          groups={nurseryInfo.groups || NURSERY_INFO.groups}
          editingChild={editingChild}
        />
      )}
    </div>
  );
}

export default App;
