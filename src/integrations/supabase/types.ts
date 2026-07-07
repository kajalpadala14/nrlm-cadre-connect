export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      // ── activities ──────────────────────────────────────────
      activities: {
        Row: {
          activity_date: string;
          activity_type: string;
          approved_at: string | null;
          approved_by: string | null;
          beneficiaries: number | null;
          block_id: string | null;
          cadre_id: string;
          comment: string | null;
          description: string | null;
          gps: string | null;
          id: string;
          panchayat: string | null;
          pdf_url: string | null;
          photo_url: string | null;
          status: string | null;
          submitted_at: string;
          village_name: string;
          voice_url: string | null;
        };
        Insert: {
          activity_date?: string;
          activity_type: string;
          approved_at?: string | null;
          approved_by?: string | null;
          beneficiaries?: number | null;
          block_id?: string | null;
          cadre_id: string;
          comment?: string | null;
          description?: string | null;
          gps?: string | null;
          id?: string;
          panchayat?: string | null;
          pdf_url?: string | null;
          photo_url?: string | null;
          status?: string | null;
          submitted_at?: string;
          village_name: string;
          voice_url?: string | null;
        };
        Update: {
          activity_date?: string;
          activity_type?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          beneficiaries?: number | null;
          block_id?: string | null;
          cadre_id?: string;
          comment?: string | null;
          description?: string | null;
          gps?: string | null;
          id?: string;
          panchayat?: string | null;
          pdf_url?: string | null;
          photo_url?: string | null;
          status?: string | null;
          submitted_at?: string;
          village_name?: string;
          voice_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activities_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_block_id_fkey";
            columns: ["block_id"];
            isOneToOne: false;
            referencedRelation: "blocks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_cadre_id_fkey_profiles";
            columns: ["cadre_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── activity_approvals ──────────────────────────────────
      activity_approvals: {
        Row: {
          activity_id: string;
          created_at: string;
          id: string;
          remarks: string | null;
          reviewed_at: string | null;
          reviewer_id: string | null;
          status: Database["public"]["Enums"]["approval_status"];
          updated_at: string;
        };
        Insert: {
          activity_id: string;
          created_at?: string;
          id?: string;
          remarks?: string | null;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          status?: Database["public"]["Enums"]["approval_status"];
          updated_at?: string;
        };
        Update: {
          activity_id?: string;
          created_at?: string;
          id?: string;
          remarks?: string | null;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          status?: Database["public"]["Enums"]["approval_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_approvals_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: true;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── attendance ──────────────────────────────────────────
      attendance: {
        Row: {
          attendance_date: string | null;
          block_id: string | null;
          cadre_id: string;
          check_in_at: string | null;
          check_out_at: string | null;
          created_at: string;
          date: string;
          id: string;
          latitude: number | null;
          longitude: number | null;
          photo_uploaded_at: string | null;
          recorded_by: string | null;
          rejection_reason: string | null;
          remarks: string | null;
          status: Database["public"]["Enums"]["attendance_status"];
          updated_at: string;
        };
        Insert: {
          attendance_date?: string | null;
          block_id?: string | null;
          cadre_id: string;
          check_in_at?: string | null;
          check_out_at?: string | null;
          created_at?: string;
          date?: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          photo_uploaded_at?: string | null;
          recorded_by?: string | null;
          rejection_reason?: string | null;
          remarks?: string | null;
          status?: Database["public"]["Enums"]["attendance_status"];
          updated_at?: string;
        };
        Update: {
          attendance_date?: string | null;
          block_id?: string | null;
          cadre_id?: string;
          check_in_at?: string | null;
          check_out_at?: string | null;
          created_at?: string;
          date?: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          photo_uploaded_at?: string | null;
          recorded_by?: string | null;
          rejection_reason?: string | null;
          remarks?: string | null;
          status?: Database["public"]["Enums"]["attendance_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_block_id_fkey";
            columns: ["block_id"];
            isOneToOne: false;
            referencedRelation: "blocks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_cadre_id_fkey";
            columns: ["cadre_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_recorded_by_fkey";
            columns: ["recorded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── blocks ──────────────────────────────────────────────
      blocks: {
        Row: {
          created_at: string;
          district_name: string | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          district_name?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          district_name?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      // ── evidence_files ──────────────────────────────────────
      evidence_files: {
        Row: {
          activity_id: string;
          cadre_id: string;
          captured_at: string | null;
          created_at: string;
          file_name: string;
          file_size: number | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          mime_type: string | null;
          public_url: string | null;
          storage_path: string;
        };
        Insert: {
          activity_id: string;
          cadre_id: string;
          captured_at?: string | null;
          created_at?: string;
          file_name: string;
          file_size?: number | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          mime_type?: string | null;
          public_url?: string | null;
          storage_path: string;
        };
        Update: {
          activity_id?: string;
          cadre_id?: string;
          captured_at?: string | null;
          created_at?: string;
          file_name?: string;
          file_size?: number | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          mime_type?: string | null;
          public_url?: string | null;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "evidence_files_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_files_cadre_id_fkey";
            columns: ["cadre_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── leave_requests ──────────────────────────────────────
      leave_requests: {
        Row: {
          id: string;
          cadre_id: string;
          block_id: string | null;
          leave_type: string;
          from_date: string;
          to_date: string;
          total_days: number;
          reason: string;
          attachment_url: string | null;
          status: string;
          approved_by: string | null;
          approved_at: string | null;
          approval_remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cadre_id: string;
          block_id?: string | null;
          leave_type: string;
          from_date: string;
          to_date: string;
          total_days: number;
          reason: string;
          attachment_url?: string | null;
          status?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          approval_remarks?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cadre_id?: string;
          block_id?: string | null;
          leave_type?: string;
          from_date?: string;
          to_date?: string;
          total_days?: number;
          reason?: string;
          attachment_url?: string | null;
          status?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          approval_remarks?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leave_requests_block_id_fkey";
            columns: ["block_id"];
            isOneToOne: false;
            referencedRelation: "blocks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_cadre_id_fkey";
            columns: ["cadre_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── notifications ───────────────────────────────────────
      notifications: {
        Row: {
          created_at: string;
          id: string;
          message: string;
          read: boolean;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message: string;
          read?: boolean;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string;
          read?: boolean;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── profiles ────────────────────────────────────────────
      profiles: {
        Row: {
          block_id: string | null;
          cadre_type: Database["public"]["Enums"]["cadre_type"] | null;
          created_at: string;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          full_name: string;
          gender: string | null;
          id: string;
          join_date: string | null;
          panchayat: string | null;
          phone: string | null;
          profile_photo_url: string | null;
          status: string | null;
          training_status: string | null;
          updated_at: string;
          user_id: string;
          village: string | null;
        };
        Insert: {
          block_id?: string | null;
          cadre_type?: Database["public"]["Enums"]["cadre_type"] | null;
          created_at?: string;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          full_name: string;
          gender?: string | null;
          id: string;
          join_date?: string | null;
          panchayat?: string | null;
          phone?: string | null;
          profile_photo_url?: string | null;
          status?: string | null;
          training_status?: string | null;
          updated_at?: string;
          user_id: string;
          village?: string | null;
        };
        Update: {
          block_id?: string | null;
          cadre_type?: Database["public"]["Enums"]["cadre_type"] | null;
          created_at?: string;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          full_name?: string;
          gender?: string | null;
          id?: string;
          join_date?: string | null;
          panchayat?: string | null;
          phone?: string | null;
          profile_photo_url?: string | null;
          status?: string | null;
          training_status?: string | null;
          updated_at?: string;
          user_id?: string;
          village?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_block_id_fkey";
            columns: ["block_id"];
            isOneToOne: false;
            referencedRelation: "blocks";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── tickets ─────────────────────────────────────────────
      tickets: {
        Row: {
          cadre_id: string;
          created_at: string;
          description: string;
          id: string;
          status: string;
          subject: string;
        };
        Insert: {
          cadre_id: string;
          created_at?: string;
          description: string;
          id?: string;
          status?: string;
          subject: string;
        };
        Update: {
          cadre_id?: string;
          created_at?: string;
          description?: string;
          id?: string;
          status?: string;
          subject?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tickets_cadre_id_fkey";
            columns: ["cadre_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── user_roles ──────────────────────────────────────────
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
      get_dashboard_stats: {
        Args: { p_date?: string; p_block_id?: string | null };
        Returns: Json;
      };
      get_block_attendance_summary: {
        Args: { p_date?: string };
        Returns: Array<{
          block_id: string;
          block_name: string;
          total_cadres: number;
          present: number;
          absent: number;
          on_leave: number;
          activities: number;
          villages: number;
          attendance_pct: number;
        }>;
      };
      get_cadre_activity_report: {
        Args: {
          p_start_date: string;
          p_end_date: string;
          p_block_id?: string | null;
        };
        Returns: Array<{
          cadre_name: string;
          cadre_type: string;
          block_name: string;
          village: string;
          present_days: number;
          absent_days: number;
          activity_count: number;
          villages_covered: number;
          pending_approvals: number;
          approved_activities: number;
        }>;
      };
    };
    Enums: {
      activity_type:
        | "SHG_Meeting"
        | "Farmer_Visit"
        | "Training_Session"
        | "Monitoring_Visit"
        | "Record_Verification"
        | "Livelihood_Activity"
        | "Other"
        | string; // New Hindi labels stored as text after migration
      app_role: "admin" | "block_officer" | "fnhw" | "si" | "cadre";
      approval_status: "pending" | "approved" | "rejected" | "revision_requested";
      attendance_status:
        | "present"
        | "late"
        | "absent"
        | "on_leave"
        | "holiday"
        | "pending_verification"
        | "pending";
      cadre_type: "PRP" | "FLCRP" | "RBK" | "IFC_Anchor" | "SR_CRP" | "FPO_CEO" | "Gender" | "FNHW" | "SI";
      leave_type: "casual" | "sick" | "earned" | "emergency" | "other";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      activity_type: [
        // Legacy enum values kept for backward compatibility
        "SHG_Meeting",
        "Farmer_Visit",
        "Training_Session",
        "Monitoring_Visit",
        "Record_Verification",
        "Livelihood_Activity",
        "Other",
        // New Hindi labels (stored as TEXT after migration)
        "स्व सहायता समूह बैठक",
        "ग्राम संगठन बैठक",
        "संकुल संगठन बैठक",
        "प्रशिक्षण",
        "शिविर",
        "पुस्तक लेखन प्रशिक्षण",
        "बैंक लिंकेज बैठक",
        "बैंक विज़िट",
        "कृषि सखी बैठक",
        "पशु सखी बैठक",
        "IFC सर्वे",
        "क्षेत्र भ्रमण",
        "LSC विज़िट",
        "ज़िला/जनपद पंचायत बैठक/प्रशिक्षण",
        "IFC बैठक",
        "अन्य",
      ],
      app_role: ["admin", "block_officer", "fnhw", "si", "cadre"],
      approval_status: ["pending", "approved", "rejected", "revision_requested"],
      attendance_status: [
        "present",
        "late",
        "absent",
        "on_leave",
        "holiday",
        "pending_verification",
        "pending",
      ],
      cadre_type: ["PRP", "FLCRP", "RBK", "IFC_Anchor", "SR_CRP", "FPO_CEO", "Gender", "FNHW", "SI"],
      leave_type: ["casual", "sick", "earned", "emergency", "other"],
    },
  },
} as const;
