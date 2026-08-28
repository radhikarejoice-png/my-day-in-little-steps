import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_ADAM_HOME_ACTIVITIES } from '../data/initialData';

/**
 * 1. Get Home Update for a Specific Schedule Activity
 */
export async function getHomeUpdateForActivity(activityId) {
  if (!activityId) {
    return { success: false, error: new Error('activityId is required.') };
  }

  if (!isSupabaseConfigured || !supabase) {
    const fallbackItem = INITIAL_ADAM_HOME_ACTIVITIES.find((a) => a.id === activityId);
    return {
      success: true,
      source: 'local',
      data: fallbackItem ? {
        id: `local-update-${activityId}`,
        schedule_activity_id: activityId,
        status: fallbackItem.status || 'not-started',
        note: fallbackItem.parentUpdate || '',
        updated_at: new Date().toISOString(),
      } : null,
    };
  }

  try {
    const { data, error } = await supabase
      .from('home_updates')
      .select('*')
      .eq('schedule_activity_id', activityId)
      .maybeSingle();

    if (error) {
      console.warn('Supabase query error for home_updates:', error.message);
      return { success: false, error };
    }

    return { success: true, source: 'supabase', data };
  } catch (err) {
    console.error('Unexpected error in getHomeUpdateForActivity:', err);
    return { success: false, error: err };
  }
}

/**
 * 2. Create or Update Home Activity Status
 * Updates or inserts a record in `home_updates`, and syncs `schedule_activities.status`.
 */
export async function createOrUpdateHomeUpdate(activityId, status, note = '') {
  if (!activityId) {
    return { success: false, error: new Error('activityId is required.') };
  }

  const validStatuses = ['not-started', 'in-progress', 'completed'];
  if (!validStatuses.includes(status)) {
    return { success: false, error: new Error(`Invalid status: ${status}. Must be one of ${validStatuses.join(', ')}`) };
  }

  if (!isSupabaseConfigured || !supabase) {
    const configError = new Error('Supabase is not configured.');
    console.error('Supabase configuration error:', configError);
    return { success: false, error: configError };
  }

  try {
    const nowIso = new Date().toISOString();

    // Check if a home_update record already exists for this activity
    const { data: existing, error: findError } = await supabase
      .from('home_updates')
      .select('id')
      .eq('schedule_activity_id', activityId)
      .maybeSingle();

    if (findError) {
      console.error('Error finding home_update:', findError);
      return { success: false, error: findError };
    }

    let updateRecord;

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('home_updates')
        .update({
          status,
          note: note || '',
          updated_at: nowIso,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating home_updates:', error);
        return { success: false, error };
      }
      updateRecord = data;
    } else {
      // Insert new record
      const updateId = `hu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const { data, error } = await supabase
        .from('home_updates')
        .insert([
          {
            id: updateId,
            schedule_activity_id: activityId,
            status,
            note: note || '',
            updated_at: nowIso,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error inserting into home_updates:', error);
        return { success: false, error };
      }
      updateRecord = data;
    }

    // Also sync the status back to schedule_activities
    await supabase
      .from('schedule_activities')
      .update({ status })
      .eq('id', activityId);

    return { success: true, source: 'supabase', data: updateRecord };
  } catch (err) {
    console.error('Unexpected error saving home update to Supabase:', err);
    return { success: false, error: err };
  }
}

/**
 * 3. Load Home Updates for an Array of Schedule Activity IDs
 */
export async function loadHomeUpdatesForActivities(activityIds = []) {
  if (!activityIds || activityIds.length === 0) {
    return { success: true, data: {} };
  }

  if (!isSupabaseConfigured || !supabase) {
    const map = {};
    INITIAL_ADAM_HOME_ACTIVITIES.forEach((a) => {
      map[a.id] = {
        status: a.status,
        note: a.parentUpdate || '',
        updated_at: new Date().toISOString(),
      };
    });
    return { success: true, source: 'local', data: map };
  }

  try {
    const { data, error } = await supabase
      .from('home_updates')
      .select('*')
      .in('schedule_activity_id', activityIds);

    if (error) {
      console.warn('Supabase query error for loadHomeUpdatesForActivities:', error.message);
      return { success: false, error, data: {} };
    }

    const updatesMap = {};
    (data || []).forEach((item) => {
      updatesMap[item.schedule_activity_id] = item;
    });

    return { success: true, source: 'supabase', data: updatesMap };
  } catch (err) {
    console.error('Unexpected error in loadHomeUpdatesForActivities:', err);
    return { success: false, error: err, data: {} };
  }
}
