export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      gallery_photos: {
        Row: {
          alt: string;
          alt_en: string | null;
          alt_ro: string | null;
          created_at: string;
          id: string;
          path: string;
          position: number;
          source_name: string;
          thumb_path: string;
        };
        ComputedFields: never;
        Insert: {
          alt: string;
          alt_en?: string | null;
          alt_ro?: string | null;
          created_at?: string;
          id?: string;
          path: string;
          position?: number;
          source_name: string;
          thumb_path: string;
        };
        Update: {
          alt?: string;
          alt_en?: string | null;
          alt_ro?: string | null;
          created_at?: string;
          id?: string;
          path?: string;
          position?: number;
          source_name?: string;
          thumb_path?: string;
        };
        Relationships: [];
      };
      pet_internal: {
        Row: {
          enclosure: string;
          pet_id: string;
        };
        ComputedFields: never;
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
          size: string | null;
          species: string;
          status: string;
          status_changed_at: string;
          status_rank: number | null;
          translations: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          birth_date: string;
          created_at?: string;
          description: string;
          health: string;
          id?: string;
          is_age_approximate: boolean;
          name: string;
          name_search?: never;
          needs_treatment_since?: string | null;
          photo_alt: string;
          photo_url: string;
          sex: string;
          size?: string | null;
          species: string;
          status?: string;
          status_changed_at?: string;
          status_rank?: never;
          translations?: NonNullable<Json>;
        };
        Update: {
          birth_date?: string;
          created_at?: string;
          description?: string;
          health?: string;
          id?: string;
          is_age_approximate?: boolean;
          name?: string;
          name_search?: never;
          needs_treatment_since?: string | null;
          photo_alt?: string;
          photo_url?: string;
          sex?: string;
          size?: string | null;
          species?: string;
          status?: string;
          status_changed_at?: string;
          status_rank?: never;
          translations?: NonNullable<Json>;
        };
        Relationships: [];
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
          status: string;
          title: string;
          translations: NonNullable<Json>;
          updated_at: string;
        };
        ComputedFields: never;
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
          status?: string;
          title: string;
          translations?: NonNullable<Json>;
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
          status?: string;
          title?: string;
          translations?: NonNullable<Json>;
          updated_at?: string;
        };
        Relationships: [];
      };
      purchase_items: {
        Row: {
          category: string;
          created_at: string;
          id: string;
          is_archived: boolean;
          is_urgent: boolean;
          name: string;
          note: string | null;
          remaining: number;
          translations: NonNullable<Json>;
          unit: string;
        };
        ComputedFields: never;
        Insert: {
          category: string;
          created_at?: string;
          id?: string;
          is_archived?: boolean;
          is_urgent?: boolean;
          name: string;
          note?: string | null;
          remaining: number;
          translations?: NonNullable<Json>;
          unit: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          id?: string;
          is_archived?: boolean;
          is_urgent?: boolean;
          name?: string;
          note?: string | null;
          remaining?: number;
          translations?: NonNullable<Json>;
          unit?: string;
        };
        Relationships: [];
      };
      purchase_log: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          item_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          item_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          item_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_log_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "purchase_items";
            referencedColumns: ["id"];
          },
        ];
      };
      shelter: {
        Row: {
          about: string | null;
          about_title: string | null;
          about_title_en: string | null;
          about_title_ro: string | null;
          address: string | null;
          adoption_info: string | null;
          brand_path: string | null;
          city: string | null;
          contact_email: string | null;
          contact_hours: string | null;
          contact_messenger: string | null;
          contact_phone: string | null;
          content_language: string;
          created_at: string;
          donation_text: string | null;
          facebook_url: string | null;
          founded_year: number | null;
          id: boolean;
          instagram_url: string | null;
          is_published: boolean;
          legal_info: string | null;
          name: string;
          name_en: string | null;
          name_ro: string | null;
          payment_url: string | null;
          paypal_email: string | null;
          photo_alt: string | null;
          photo_path: string | null;
          telegram_url: string | null;
          tiktok_url: string | null;
          translations: NonNullable<Json>;
          viber_url: string | null;
          whatsapp_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          about?: string | null;
          about_title?: string | null;
          about_title_en?: string | null;
          about_title_ro?: string | null;
          address?: string | null;
          adoption_info?: string | null;
          brand_path?: string | null;
          city?: string | null;
          contact_email?: string | null;
          contact_hours?: string | null;
          contact_messenger?: string | null;
          contact_phone?: string | null;
          content_language?: string;
          created_at?: string;
          donation_text?: string | null;
          facebook_url?: string | null;
          founded_year?: number | null;
          id?: boolean;
          instagram_url?: string | null;
          is_published?: boolean;
          legal_info?: string | null;
          name: string;
          name_en?: string | null;
          name_ro?: string | null;
          payment_url?: string | null;
          paypal_email?: string | null;
          photo_alt?: string | null;
          photo_path?: string | null;
          telegram_url?: string | null;
          tiktok_url?: string | null;
          translations?: NonNullable<Json>;
          viber_url?: string | null;
          whatsapp_url?: string | null;
        };
        Update: {
          about?: string | null;
          about_title?: string | null;
          about_title_en?: string | null;
          about_title_ro?: string | null;
          address?: string | null;
          adoption_info?: string | null;
          brand_path?: string | null;
          city?: string | null;
          contact_email?: string | null;
          contact_hours?: string | null;
          contact_messenger?: string | null;
          contact_phone?: string | null;
          content_language?: string;
          created_at?: string;
          donation_text?: string | null;
          facebook_url?: string | null;
          founded_year?: number | null;
          id?: boolean;
          instagram_url?: string | null;
          is_published?: boolean;
          legal_info?: string | null;
          name?: string;
          name_en?: string | null;
          name_ro?: string | null;
          payment_url?: string | null;
          paypal_email?: string | null;
          photo_alt?: string | null;
          photo_path?: string | null;
          telegram_url?: string | null;
          tiktok_url?: string | null;
          translations?: NonNullable<Json>;
          viber_url?: string | null;
          whatsapp_url?: string | null;
        };
        Relationships: [];
      };
      volunteers: {
        Row: {
          created_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      volunteer_pets: {
        Row: {
          birth_date: string;
          created_at: string;
          enclosure: string | null;
          id: string;
          is_age_approximate: boolean;
          name: string;
          needs_treatment_since: string | null;
          photo_url: string;
          review_rank: number | null;
          review_since: string | null;
          search_text: string | null;
          sex: string;
          size: string | null;
          species: string;
          status: string;
          status_changed_at: string;
        };
        ComputedFields: never;
        Relationships: [];
      };
    };
    Functions: {
      has_second_factor: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_site_published: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_volunteer: { Args: Record<PropertyKey, never>; Returns: boolean };
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
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
  public: {
    Enums: {},
  },
} as const;
