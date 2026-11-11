export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      pet_internal: {
        Row: {
          enclosure: string;
          pet_id: string;
        };
        Insert: {
          enclosure: string;
          pet_id: string;
        };
        Update: {
          enclosure?: string;
          pet_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pet_internal_pet_id_fkey";
            columns: ["pet_id"];
            isOneToOne: true;
            referencedRelation: "pets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pet_internal_pet_id_fkey";
            columns: ["pet_id"];
            isOneToOne: true;
            referencedRelation: "volunteer_pets";
            referencedColumns: ["id"];
          },
        ];
      };
      pets: {
        Row: {
          birth_date: string;
          created_at: string;
          description: string;
          health: string;
          id: string;
          is_age_approximate: boolean;
          name: string;
          name_search: string | null;
          needs_treatment_since: string | null;
          photo_alt: string;
          photo_url: string;
          sex: string;
          shelter_id: string;
          size: string | null;
          species: string;
          status: string;
          status_changed_at: string;
          status_rank: number | null;
          translations: Json;
        };
        Insert: {
          birth_date: string;
          created_at?: string;
          description: string;
          health: string;
          id?: string;
          is_age_approximate: boolean;
          name: string;
          name_search?: string | null;
          needs_treatment_since?: string | null;
          photo_alt: string;
          photo_url: string;
          sex: string;
          shelter_id: string;
          size?: string | null;
          species: string;
          status?: string;
          status_changed_at?: string;
          status_rank?: number | null;
          translations?: Json;
        };
        Update: {
          birth_date?: string;
          created_at?: string;
          description?: string;
          health?: string;
          id?: string;
          is_age_approximate?: boolean;
          name?: string;
          name_search?: string | null;
          needs_treatment_since?: string | null;
          photo_alt?: string;
          photo_url?: string;
          sex?: string;
          shelter_id?: string;
          size?: string | null;
          species?: string;
          status?: string;
          status_changed_at?: string;
          status_rank?: number | null;
          translations?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "pets_shelter_id_fkey";
            columns: ["shelter_id"];
            isOneToOne: false;
            referencedRelation: "shelters";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          completed_at: string | null;
          created_at: string;
          description: string;
          help_kinds: string[];
          id: string;
          is_archived: boolean;
          is_pinned: boolean;
          photo_alt: string | null;
          photo_path: string | null;
          progress_done: number | null;
          progress_total: number | null;
          progress_unit: string | null;
          shelter_id: string;
          status: string;
          title: string;
          translations: Json;
          updated_at: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          description: string;
          help_kinds?: string[];
          id?: string;
          is_archived?: boolean;
          is_pinned?: boolean;
          photo_alt?: string | null;
          photo_path?: string | null;
          progress_done?: number | null;
          progress_total?: number | null;
          progress_unit?: string | null;
          shelter_id: string;
          status?: string;
          title: string;
          translations?: Json;
          updated_at?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          description?: string;
          help_kinds?: string[];
          id?: string;
          is_archived?: boolean;
          is_pinned?: boolean;
          photo_alt?: string | null;
          photo_path?: string | null;
          progress_done?: number | null;
          progress_total?: number | null;
          progress_unit?: string | null;
          shelter_id?: string;
          status?: string;
          title?: string;
          translations?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_shelter_id_fkey";
            columns: ["shelter_id"];
            isOneToOne: false;
            referencedRelation: "shelters";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_items: {
        Row: {
          category: string;
          created_at: string;
          id: string;
          is_archived: boolean;
          is_urgent: boolean;
          note: string | null;
          name: string;
          remaining: number;
          shelter_id: string;
          translations: Json;
          unit: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          id?: string;
          is_archived?: boolean;
          is_urgent?: boolean;
          note?: string | null;
          name: string;
          remaining: number;
          shelter_id: string;
          translations?: Json;
          unit: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          id?: string;
          is_archived?: boolean;
          is_urgent?: boolean;
          note?: string | null;
          name?: string;
          remaining?: number;
          shelter_id?: string;
          translations?: Json;
          unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_items_shelter_id_fkey";
            columns: ["shelter_id"];
            isOneToOne: false;
            referencedRelation: "shelters";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_log: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          item_id: string;
          shelter_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          item_id: string;
          shelter_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          item_id?: string;
          shelter_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_log_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "purchase_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_log_shelter_id_fkey";
            columns: ["shelter_id"];
            isOneToOne: false;
            referencedRelation: "shelters";
            referencedColumns: ["id"];
          },
        ];
      };
      shelter_members: {
        Row: {
          shelter_id: string;
          user_id: string;
        };
        Insert: {
          shelter_id: string;
          user_id: string;
        };
        Update: {
          shelter_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shelter_members_shelter_id_fkey";
            columns: ["shelter_id"];
            isOneToOne: false;
            referencedRelation: "shelters";
            referencedColumns: ["id"];
          },
        ];
      };
      shelters: {
        Row: {
          about: string | null;
          address: string | null;
          adoption_info: string | null;
          city: string | null;
          contact_hours: string | null;
          contact_messenger: string | null;
          contact_phone: string | null;
          facebook_url: string | null;
          whatsapp_url: string | null;
          payment_url: string | null;
          paypal_email: string | null;
          donation_text: string | null;
          contact_email: string | null;
          name_en: string | null;
          name_ro: string | null;
          brand_path: string | null;
          is_published: boolean;
          content_language: string;
          created_at: string;
          founded_year: number | null;
          id: string;
          instagram_url: string | null;
          legal_info: string | null;
          name: string;
          photo_alt: string | null;
          photo_path: string | null;
          slug: string;
          telegram_url: string | null;
          translations: Json;
          viber_url: string | null;
        };
        Insert: {
          about?: string | null;
          address?: string | null;
          adoption_info?: string | null;
          city?: string | null;
          contact_hours?: string | null;
          contact_messenger?: string | null;
          contact_phone?: string | null;
          facebook_url?: string | null;
          whatsapp_url?: string | null;
          payment_url?: string | null;
          paypal_email?: string | null;
          donation_text?: string | null;
          contact_email?: string | null;
          name_en?: string | null;
          name_ro?: string | null;
          brand_path?: string | null;
          is_published?: boolean;
          content_language?: string;
          created_at?: string;
          founded_year?: number | null;
          id?: string;
          instagram_url?: string | null;
          legal_info?: string | null;
          name: string;
          photo_alt?: string | null;
          photo_path?: string | null;
          slug: string;
          telegram_url?: string | null;
          translations?: Json;
          viber_url?: string | null;
        };
        Update: {
          about?: string | null;
          address?: string | null;
          adoption_info?: string | null;
          city?: string | null;
          contact_hours?: string | null;
          contact_messenger?: string | null;
          contact_phone?: string | null;
          facebook_url?: string | null;
          whatsapp_url?: string | null;
          payment_url?: string | null;
          paypal_email?: string | null;
          donation_text?: string | null;
          contact_email?: string | null;
          name_en?: string | null;
          name_ro?: string | null;
          brand_path?: string | null;
          is_published?: boolean;
          content_language?: string;
          created_at?: string;
          founded_year?: number | null;
          id?: string;
          instagram_url?: string | null;
          legal_info?: string | null;
          name?: string;
          photo_alt?: string | null;
          photo_path?: string | null;
          slug?: string;
          telegram_url?: string | null;
          translations?: Json;
          viber_url?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      volunteer_pets: {
        Row: {
          birth_date: string | null;
          created_at: string | null;
          enclosure: string | null;
          id: string | null;
          is_age_approximate: boolean | null;
          name: string | null;
          needs_treatment_since: string | null;
          photo_url: string | null;
          review_rank: number | null;
          review_since: string | null;
          search_text: string | null;
          sex: string | null;
          shelter_id: string | null;
          size: string | null;
          species: string | null;
          status: string | null;
          status_changed_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pets_shelter_id_fkey";
            columns: ["shelter_id"];
            isOneToOne: false;
            referencedRelation: "shelters";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      receive_purchase: {
        Args: { p_amount: number; p_item_id: string };
        Returns: number;
      };
      record_consumption: {
        Args: { p_amount: number; p_item_id: string };
        Returns: number;
      };
      translit_ru: { Args: { input: string }; Returns: string };
      undo_purchase: { Args: { p_log_id: string }; Returns: number };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
