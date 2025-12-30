
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Use environment variables or placeholders if not set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TABLE_MAP = {
  Building: 'buildings',
  Unit: 'units',
  BuildingMember: 'building_members',
  BillCycle: 'bill_cycles',
  BillItemTemplate: 'bill_item_templates',
  BillItem: 'bill_items',
  UnitCharge: 'unit_charges',
  PaymentStatus: 'payment_statuses',
  Invitation: 'invitations',
  RoleChangeRequest: 'role_change_requests',
  NotificationLog: 'notification_logs',
};

const createEntityClient = (entityName) => {
  const table = TABLE_MAP[entityName];
  if (!table) throw new Error(`Unknown entity: ${entityName}`);

  return {
    list: async () => {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw error;
      return data;
    },
    get: async (id) => {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (payload) => {
      const { data, error } = await supabase.from(table).insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, payload) => {
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    filter: async (query) => {
      let builder = supabase.from(table).select('*');
      Object.keys(query).forEach(key => {
        builder = builder.eq(key, query[key]);
      });
      const { data, error } = await builder;
      if (error) throw error;
      return data;
    }
  };
};

export const base44 = {
  supabase: supabase, // Expose raw client
  auth: {
    // Current user state wrapper
    currentUser: null,
    
    // Sign in with Google
    signIn: async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/Onboarding',
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      if (error) throw error;
      return data;
    },

    // Sign in with Kakao
    signInWithKakao: async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
           redirectTo: window.location.origin + '/Onboarding',
        },
      });
      if (error) throw error;
      return data;
    },

    // Sign in with Email/Password
    signInWithAuth: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },

    // Sign up with Email/Password
    signUp: async (email, password) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },

    // Sign out
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    
    // Redirect to Login
    redirectToLogin: () => {
        window.location.href = '/Login';
    },

    // Alias for compatibility
    logout: async () => {
      await base44.auth.signOut();
    },

    // Auth state change listener
    onAuthStateChanged: (callback) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        const user = session?.user || null;
        // Update mock currentUser for compatibility
        base44.auth.currentUser = user ? {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'representative', // Fallback role
          ...user
        } : null;
        
        callback(base44.auth.currentUser);
      });
      return () => subscription.unsubscribe();
    },

    // Get current user (async wrapper)
    me: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw error || new Error('No user found');
      
      // Update local reference
       base44.auth.currentUser = {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'representative',
          ...user
       };
       return base44.auth.currentUser;
    }
  },

  entities: Object.keys(TABLE_MAP).reduce((acc, entityName) => {
    acc[entityName] = createEntityClient(entityName);
    return acc;
  }, {})
};
