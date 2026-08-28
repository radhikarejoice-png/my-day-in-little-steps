import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_ADAM_SCHEDULE } from '../data/initialData';

/**
 * Helper to map DB schedule activity record to frontend model
 */
function mapActivityFromDb(row) {
  return {
    id: String(row.id),
    scheduleId: String(row.schedule_id),
    name: row.activity_name || '',
    icon: row.icon || '🗓️',
    time: row.activity_time || '',
    type: row.location || 'Nursery',
    order: Number(row.activity_order) || 0,
    status: row.status || 'not-started',
    createdAt: row.created_at,
  };
}

/**
 * 1. Get Schedule for a Child on a Specific Date
 * Fetches the parent schedule row and its nested child activities ordered by activity_order.
 */
export async function getScheduleForChild(childId, scheduleDate = new Date().toISOString().split('T')[0]) {
  if (!childId) {
    return { success: false, error: new Error('childId is required.') };
  }

  if (!isSupabaseConfigured || !supabase) {
    return {
      success: true,
      source: 'local',
      data: {
        id: 'local-schedule',
        childId,
        scheduleDate,
        activities: INITIAL_ADAM_SCHEDULE,
      },
    };
  }

  try {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        id,
        child_id,
        schedule_date,
        created_at,
        schedule_activities (
          id,
          schedule_id,
          activity_name,
          icon,
          activity_time,
          location,
          activity_order,
          status,
          created_at
        )
      `)
      .eq('child_id', childId)
      .eq('schedule_date', scheduleDate)
      .maybeSingle();

    if (error) {
      console.warn('Supabase query error for schedule, falling back:', error.message);
      return { success: false, error, fallback: INITIAL_ADAM_SCHEDULE };
    }

    if (!data) {
      return { success: true, source: 'supabase', data: null };
    }

    const sortedActivities = (data.schedule_activities || [])
      .sort((a, b) => (Number(a.activity_order) || 0) - (Number(b.activity_order) || 0))
      .map(mapActivityFromDb);

    return {
      success: true,
      source: 'supabase',
      data: {
        id: String(data.id),
        childId: String(data.child_id),
        scheduleDate: data.schedule_date,
        createdAt: data.created_at,
        activities: sortedActivities,
      },
    };
  } catch (err) {
    console.error('Unexpected error fetching schedule from Supabase:', err);
    return { success: false, error: err };
  }
}

/**
 * 2. Create Schedule
 * Inserts a parent schedule row and optionally bulk inserts initial activities.
 */
export async function createSchedule(childId, scheduleDate = new Date().toISOString().split('T')[0], activities = []) {
  if (!childId) {
    return { success: false, error: new Error('childId is required.') };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: new Error('Supabase is not configured.') };
  }

  const scheduleId = `sch-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    // 1. Insert parent schedule
    const { data: scheduleData, error: schError } = await supabase
      .from('schedules')
      .insert([
        {
          id: scheduleId,
          child_id: childId,
          schedule_date: scheduleDate,
        },
      ])
      .select()
      .single();

    if (schError) {
      console.error('Error creating schedule in Supabase:', schError);
      return { success: false, error: schError };
    }

    // 2. Insert activities if provided
    let insertedActivities = [];
    if (activities && activities.length > 0) {
      const activityPayloads = activities.map((act, index) => ({
        id: act.id || `act-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
        schedule_id: scheduleId,
        activity_name: act.name || act.activity_name || '',
        icon: act.icon || '🗓️',
        activity_time: act.time || act.activity_time || '',
        location: act.type || act.location || 'Nursery',
        activity_order: index + 1,
        status: act.status || 'not-started',
      }));

      const { data: actData, error: actError } = await supabase
        .from('schedule_activities')
        .insert(activityPayloads)
        .select();

      if (actError) {
        console.error('Error creating schedule activities in Supabase:', actError);
      } else {
        insertedActivities = (actData || []).map(mapActivityFromDb);
      }
    }

    return {
      success: true,
      data: {
        id: String(scheduleData.id),
        childId: String(scheduleData.child_id),
        scheduleDate: scheduleData.schedule_date,
        createdAt: scheduleData.created_at,
        activities: insertedActivities,
      },
    };
  } catch (err) {
    console.error('Unexpected error creating schedule in Supabase:', err);
    return { success: false, error: err };
  }
}

/**
 * 3. Update Schedule
 * Updates schedule metadata and optionally replaces/syncs its activity sequence.
 */
export async function updateSchedule(scheduleId, updates = {}, activities = null) {
  if (!scheduleId) {
    return { success: false, error: new Error('scheduleId is required.') };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: new Error('Supabase is not configured.') };
  }

  try {
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('schedules')
        .update(updates)
        .eq('id', scheduleId);

      if (updateError) {
        console.error('Error updating schedule in Supabase:', updateError);
        return { success: false, error: updateError };
      }
    }

    // If a full list of activities is supplied to replace current schedule list
    if (Array.isArray(activities)) {
      // Remove old activities
      await supabase
        .from('schedule_activities')
        .delete()
        .eq('schedule_id', scheduleId);

      // Insert new activities
      if (activities.length > 0) {
        const activityPayloads = activities.map((act, index) => ({
          id: act.id && !act.id.startsWith('temp-')
            ? act.id
            : `act-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
          schedule_id: scheduleId,
          activity_name: act.name || act.activity_name || '',
          icon: act.icon || '🗓️',
          activity_time: act.time || act.activity_time || '',
          location: act.type || act.location || 'Nursery',
          activity_order: index + 1,
          status: act.status || 'not-started',
        }));

        const { error: insertError } = await supabase
          .from('schedule_activities')
          .insert(activityPayloads);

        if (insertError) {
          console.error('Error updating schedule activities in Supabase:', insertError);
          return { success: false, error: insertError };
        }
      }
    }

    return { success: true, id: scheduleId };
  } catch (err) {
    console.error('Unexpected error updating schedule in Supabase:', err);
    return { success: false, error: err };
  }
}

/**
 * 4. Delete Schedule
 * Deletes a schedule row from Supabase (cascades to schedule_activities via foreign key).
 */
export async function deleteSchedule(scheduleId) {
  if (!scheduleId) {
    return { success: false, error: new Error('scheduleId is required.') };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: new Error('Supabase is not configured.') };
  }

  try {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) {
      console.error('Error deleting schedule from Supabase:', error);
      return { success: false, error };
    }

    return { success: true, id: scheduleId };
  } catch (err) {
    console.error('Unexpected error deleting schedule from Supabase:', err);
    return { success: false, error: err };
  }
}

/**
 * 5. Add Single Activity
 * Appends an activity to a schedule.
 */
export async function addScheduleActivity(scheduleId, activityData) {
  if (!scheduleId) {
    return { success: false, error: new Error('scheduleId is required.') };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: new Error('Supabase is not configured.') };
  }

  const actId = activityData.id || `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const payload = {
    id: actId,
    schedule_id: scheduleId,
    activity_name: activityData.name || activityData.activity_name || '',
    icon: activityData.icon || '🗓️',
    activity_time: activityData.time || activityData.activity_time || '',
    location: activityData.type || activityData.location || 'Nursery',
    activity_order: Number(activityData.order || activityData.activity_order) || 1,
    status: activityData.status || 'not-started',
  };

  try {
    const { data, error } = await supabase
      .from('schedule_activities')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error adding activity to Supabase:', error);
      return { success: false, error };
    }

    return { success: true, data: mapActivityFromDb(data) };
  } catch (err) {
    console.error('Unexpected error adding activity to Supabase:', err);
    return { success: false, error: err };
  }
}

/**
 * 6. Update Single Activity
 * Updates a single activity's details or progress status.
 */
export async function updateScheduleActivity(activityId, activityUpdates) {
  if (!activityId) {
    return { success: false, error: new Error('activityId is required.') };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: new Error('Supabase is not configured.') };
  }

  const payload = {};
  if (activityUpdates.name !== undefined) payload.activity_name = activityUpdates.name;
  if (activityUpdates.activity_name !== undefined) payload.activity_name = activityUpdates.activity_name;
  if (activityUpdates.icon !== undefined) payload.icon = activityUpdates.icon;
  if (activityUpdates.time !== undefined) payload.activity_time = activityUpdates.time;
  if (activityUpdates.activity_time !== undefined) payload.activity_time = activityUpdates.activity_time;
  if (activityUpdates.type !== undefined) payload.location = activityUpdates.type;
  if (activityUpdates.location !== undefined) payload.location = activityUpdates.location;
  if (activityUpdates.order !== undefined) payload.activity_order = activityUpdates.order;
  if (activityUpdates.activity_order !== undefined) payload.activity_order = activityUpdates.activity_order;
  if (activityUpdates.status !== undefined) payload.status = activityUpdates.status;

  try {
    const { data, error } = await supabase
      .from('schedule_activities')
      .update(payload)
      .eq('id', activityId)
      .select()
      .single();

    if (error) {
      console.error('Error updating activity in Supabase:', error);
      return { success: false, error };
    }

    return { success: true, data: mapActivityFromDb(data) };
  } catch (err) {
    console.error('Unexpected error updating activity in Supabase:', err);
    return { success: false, error: err };
  }
}

/**
 * 7. Delete Single Activity
 * Removes an activity from a schedule.
 */
export async function deleteScheduleActivity(activityId) {
  if (!activityId) {
    return { success: false, error: new Error('activityId is required.') };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: new Error('Supabase is not configured.') };
  }

  try {
    const { error } = await supabase
      .from('schedule_activities')
      .delete()
      .eq('id', activityId);

    if (error) {
      console.error('Error deleting activity from Supabase:', error);
      return { success: false, error };
    }

    return { success: true, id: activityId };
  } catch (err) {
    console.error('Unexpected error deleting activity from Supabase:', err);
    return { success: false, error: err };
  }
}

/**
 * 8. Save Schedule for Child (Create or Replace/Update)
 * Checks if a schedule exists for the child on that date:
 * - If exists, replaces its activities sequence with the new activities.
 * - If not, creates a new schedule and inserts the activities list.
 * Preserves the unique (child_id, schedule_date) constraint.
 */
export async function saveScheduleForChild(childId, scheduleDate = new Date().toISOString().split('T')[0], activities = []) {
  if (!childId) {
    return { success: false, error: new Error('childId is required.') };
  }

  if (!isSupabaseConfigured || !supabase) {
    const configError = new Error('Supabase is not configured.');
    console.error('Supabase configuration error:', configError);
    return { success: false, error: configError };
  }

  try {
    // 1. Check if schedule already exists for child & date
    const { data: existingSchedule, error: findError } = await supabase
      .from('schedules')
      .select('id')
      .eq('child_id', childId)
      .eq('schedule_date', scheduleDate)
      .maybeSingle();

    if (findError) {
      console.error('Error finding existing schedule:', findError);
      return { success: false, error: findError };
    }

    let scheduleId;

    if (existingSchedule) {
      scheduleId = existingSchedule.id;

      // Cleanly replace old activities
      const { error: delError } = await supabase
        .from('schedule_activities')
        .delete()
        .eq('schedule_id', scheduleId);

      if (delError) {
        console.error('Error clearing old activities:', delError);
        return { success: false, error: delError };
      }
    } else {
      scheduleId = `sch-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const { error: insError } = await supabase
        .from('schedules')
        .insert([
          {
            id: scheduleId,
            child_id: childId,
            schedule_date: scheduleDate,
          },
        ]);

      if (insError) {
        console.error('Error inserting schedule:', insError);
        return { success: false, error: insError };
      }
    }

    // 2. Insert activities
    let insertedActivities = [];
    if (activities && activities.length > 0) {
      const activityPayloads = activities.map((act, index) => ({
        id: act.id && !act.id.startsWith('temp-')
          ? act.id
          : `act-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
        schedule_id: scheduleId,
        activity_name: act.name || act.activity_name || '',
        icon: act.icon || '🗓️',
        activity_time: act.time || act.activity_time || '',
        location: act.type || act.location || 'Nursery',
        activity_order: index + 1,
        status: act.status || 'not-started',
      }));

      const { data: actData, error: actError } = await supabase
        .from('schedule_activities')
        .insert(activityPayloads)
        .select();

      if (actError) {
        console.error('Error inserting schedule activities:', actError);
        return { success: false, error: actError };
      }

      insertedActivities = (actData || []).map(mapActivityFromDb);
    }

    return {
      success: true,
      source: 'supabase',
      data: {
        id: scheduleId,
        childId,
        scheduleDate,
        activities: insertedActivities,
      },
    };
  } catch (err) {
    console.error('Unexpected error saving schedule to Supabase:', err);
    return { success: false, error: err };
  }
}

