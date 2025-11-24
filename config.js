// config.js
import { supabase } from './js/supabase.js';

export const SUPABASE_CONFIG = {
  url: 'https://ztjokngpzbsuykwpcscz.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0am9rbmdwemJzdXlrd3Bjc2N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODAzNTIsImV4cCI6MjA3OTU1NjM1Mn0.jojOEgs3-MacLbT3i7wYoIiEkD4Z6K-Ym1EgBD1qVPs'
};

export let APP_CONFIG = {};

export const loadAppConfig = async () => {
  try {
    console.log('Loading app configuration from database...');
    
    const { data, error } = await supabase
      .from('app_settings')
      .select('*');
    
    if (error) {
      console.error('Error loading settings:', error);
      throw error;
    }
    
    console.log('Settings loaded:', data);
    
    const config = {};
    if (data) {
      data.forEach(setting => {
        config[setting.key] = setting.value;
      });
    }
    
    APP_CONFIG = {
      taskPricePer1k: config.task_pricing?.price_per_1k || 1,
      minMembers: config.task_pricing?.min_members || 500,
      maxMembers: config.task_pricing?.max_members || 10000,
      adValue: config.ads_config?.ad_value || 10,
      dailyAdLimit: config.ads_config?.daily_limit || 50,
      conversionRate: config.ads_config?.conversion_rate || 10000,
      minWithdraw: config.withdrawal?.min_amount || 0.1,
      withdrawFee: config.withdrawal?.fee_percentage || 0,
      appName: config.general?.app_name || 'TON BOSS',
      version: config.general?.version || '2.0.0'
    };
    
    console.log('Final APP_CONFIG:', APP_CONFIG);
    return APP_CONFIG;
    
  } catch (error) {
    console.error('Failed to load app config, using defaults:', error);
    
    APP_CONFIG = {
      taskPricePer1k: 1,
      minMembers: 500,
      maxMembers: 10000,
      adValue: 10,
      dailyAdLimit: 50,
      conversionRate: 10000,
      minWithdraw: 0.1,
      withdrawFee: 0,
      appName: 'TON BOSS',
      version: '2.0.0'
    };
    
    return APP_CONFIG;
  }
};

export const updateAppSetting = async (key, value) => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .upsert({ 
        key: key,
        value: value,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      });
    
    if (error) throw error;
    
    APP_CONFIG = await loadAppConfig();
    return data;
    
  } catch (error) {
    console.error('Error updating setting:', error);
    throw error;
  }
};
