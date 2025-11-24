import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG } from '../config.js';

export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

export class DatabaseManager {
  
  static async getUser(telegramId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async createUser(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateUser(telegramId, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('telegram_id', telegramId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getUserTasks(userId) {
    const { data, error } = await supabase
      .from('user_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createUserTask(taskData) {
    const { data, error } = await supabase
      .from('user_tasks')
      .insert([taskData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateUserTask(taskId, updates) {
    const { data, error } = await supabase
      .from('user_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  
  static async logTransaction(transaction) {
    const { error } = await supabase
      .from('transactions')
      .insert([transaction]);
    
    if (error) console.error('Transaction log error:', error);
  }

  
  static async createWithdrawal(withdrawalData) {
    const { data, error } = await supabase
      .from('withdrawals')
      .insert([withdrawalData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getUserWithdrawals(userId) {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
      }
