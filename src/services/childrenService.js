import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_CHILDREN } from '../data/initialData';

/**
 * Loads children list from Supabase if configured, otherwise falls back to local sample data.
 */
export async function fetchChildrenFromSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: INITIAL_CHILDREN, source: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Supabase query error for children table, falling back to local sample data:', error.message);
      return { data: INITIAL_CHILDREN, source: 'local', error };
    }

    if (!data || data.length === 0) {
      return { data: INITIAL_CHILDREN, source: 'local' };
    }

    // Map database columns to app schema
    const formattedChildren = data.map((row) => ({
      id: String(row.id),
      name: row.name || 'Unnamed Child',
      group: row.group || row.group_id || 'butterfly',
      groupName: row.group_name || row.groupName || 'Butterfly Group',
      age: row.age || 'Age 3',
      avatarEmoji: row.avatar_emoji || row.avatarEmoji || '👶',
      avatarBg: row.avatar_bg || row.avatarBg || '#FFE5EC',
      scheduleStatus: row.schedule_status || row.scheduleStatus || 'not-created',
    }));

    return { data: formattedChildren, source: 'supabase' };
  } catch (err) {
    console.warn('Failed to load children from Supabase, using local sample data:', err);
    return { data: INITIAL_CHILDREN, source: 'local', error: err };
  }
}

/**
 * Inserts a new child into the Supabase `children` table.
 * Returns { success: true, data: formattedChild } on success, or { success: false, error } on failure.
 */
export async function insertChildToSupabase(childData) {
  // 1. Validate required fields
  if (!childData?.name?.trim()) {
    return { success: false, error: new Error('Child name is required.') };
  }
  if (!childData?.age?.trim()) {
    return { success: false, error: new Error('Child age is required.') };
  }
  if (!childData?.group) {
    return { success: false, error: new Error('Child group is required.') };
  }

  if (!isSupabaseConfigured || !supabase) {
    const configError = new Error('Supabase is not configured. Check your .env credentials.');
    console.error('Supabase configuration error:', configError);
    return { success: false, error: configError };
  }

  // 2. Generate unique ID safely in JavaScript
  const childId = childData.id || `ch-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const payload = {
    id: childId,
    name: childData.name.trim(),
    group_name: childData.groupName || 'Butterfly Group',
    group_id: childData.group || 'butterfly',
    age: childData.age.trim(),
    avatar_emoji: childData.avatarEmoji || '👶',
    avatar_bg: childData.avatarBg || '#FFE5EC',
    schedule_status: childData.scheduleStatus || 'ready',
  };

  try {
    const { data, error } = await supabase
      .from('children')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Supabase error inserting child:', error);
      return { success: false, error };
    }

    const insertedChild = {
      id: String(data.id),
      name: data.name,
      group: data.group_id || data.group || 'butterfly',
      groupName: data.group_name || 'Butterfly Group',
      age: data.age,
      avatarEmoji: data.avatar_emoji || '👶',
      avatarBg: data.avatar_bg || '#FFE5EC',
      scheduleStatus: data.schedule_status || 'ready',
    };

    return { success: true, data: insertedChild };
  } catch (err) {
    console.error('Unexpected error inserting child to Supabase:', err);
    return { success: false, error: err };
  }
}

/**
 * Updates an existing child in the Supabase `children` table.
 * Returns { success: true, data: formattedChild } on success, or { success: false, error } on failure.
 */
export async function updateChildInSupabase(childData) {
  // 1. Validate required fields
  if (!childData?.id) {
    return { success: false, error: new Error('Child ID is required to update.') };
  }
  if (!childData?.name?.trim()) {
    return { success: false, error: new Error('Child name is required.') };
  }
  if (!childData?.age?.trim()) {
    return { success: false, error: new Error('Child age is required.') };
  }
  if (!childData?.group) {
    return { success: false, error: new Error('Child group is required.') };
  }

  if (!isSupabaseConfigured || !supabase) {
    const configError = new Error('Supabase is not configured. Check your .env credentials.');
    console.error('Supabase configuration error:', configError);
    return { success: false, error: configError };
  }

  const payload = {
    name: childData.name.trim(),
    group_name: childData.groupName || 'Butterfly Group',
    group_id: childData.group || 'butterfly',
    age: childData.age.trim(),
    avatar_emoji: childData.avatarEmoji || '👶',
    avatar_bg: childData.avatarBg || '#FFE5EC',
    schedule_status: childData.scheduleStatus || 'ready',
  };

  try {
    const { data, error } = await supabase
      .from('children')
      .update(payload)
      .eq('id', childData.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating child:', error);
      return { success: false, error };
    }

    const updatedChild = {
      id: String(data.id),
      name: data.name,
      group: data.group_id || data.group || 'butterfly',
      groupName: data.group_name || 'Butterfly Group',
      age: data.age,
      avatarEmoji: data.avatar_emoji || '👶',
      avatarBg: data.avatar_bg || '#FFE5EC',
      scheduleStatus: data.schedule_status || 'ready',
    };

    return { success: true, data: updatedChild };
  } catch (err) {
    console.error('Unexpected error updating child in Supabase:', err);
    return { success: false, error: err };
  }
}

/**
 * Deletes a child from the Supabase `children` table.
 * Returns { success: true, id: childId } on success, or { success: false, error } on failure.
 */
export async function deleteChildFromSupabase(childId) {
  if (!childId) {
    return { success: false, error: new Error('Child ID is required to delete.') };
  }

  if (!isSupabaseConfigured || !supabase) {
    const configError = new Error('Supabase is not configured. Check your .env credentials.');
    console.error('Supabase configuration error:', configError);
    return { success: false, error: configError };
  }

  try {
    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', childId);

    if (error) {
      console.error('Supabase error deleting child:', error);
      return { success: false, error };
    }

    return { success: true, id: childId };
  } catch (err) {
    console.error('Unexpected error deleting child from Supabase:', err);
    return { success: false, error: err };
  }
}



