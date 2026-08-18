export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      beds24_token_cache: {
        Row: {
          access_token: string
          expires_at: string
          id: number
        }
        Insert: {
          access_token: string
          expires_at: string
          id?: number
        }
        Update: {
          access_token?: string
          expires_at?: string
          id?: number
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          coupon_code: string | null
          created_at: string
          id: string
          launched_at: string | null
          name_he: string
          owner_id: string | null
          scheduled_at: string | null
          segment: Json
          stats: Json
          status: Database["public"]["Enums"]["campaign_status"]
          template_id: string | null
          updated_at: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          id?: string
          launched_at?: string | null
          name_he: string
          owner_id?: string | null
          scheduled_at?: string | null
          segment?: Json
          stats?: Json
          status?: Database["public"]["Enums"]["campaign_status"]
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          id?: string
          launched_at?: string | null
          name_he?: string
          owner_id?: string | null
          scheduled_at?: string | null
          segment?: Json
          stats?: Json
          status?: Database["public"]["Enums"]["campaign_status"]
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "wa_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          body: string | null
          campaign_id: string | null
          channel: string
          created_at: string
          customer_id: string | null
          direction: string
          id: string
          lead_id: string | null
          owner_id: string
          sent_at: string
          status: string | null
          subject: string | null
        }
        Insert: {
          body?: string | null
          campaign_id?: string | null
          channel: string
          created_at?: string
          customer_id?: string | null
          direction?: string
          id?: string
          lead_id?: string | null
          owner_id: string
          sent_at?: string
          status?: string | null
          subject?: string | null
        }
        Update: {
          body?: string | null
          campaign_id?: string | null
          channel?: string
          created_at?: string
          customer_id?: string | null
          direction?: string
          id?: string
          lead_id?: string | null
          owner_id?: string
          sent_at?: string
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_consent: {
        Row: {
          customer_id: string
          opted_in: boolean
          reason: string | null
          updated_at: string
        }
        Insert: {
          customer_id: string
          opted_in?: boolean
          reason?: string | null
          updated_at?: string
        }
        Update: {
          customer_id?: string
          opted_in?: boolean
          reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_consent_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tags: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          source: string
          tag: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          source?: string
          tag: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          source?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tags_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          id_number: string | null
          lifecycle: string | null
          manychat_id: string | null
          notes: string | null
          owner_id: string
          phone: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          id_number?: string | null
          lifecycle?: string | null
          manychat_id?: string | null
          notes?: string | null
          owner_id: string
          phone?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          id_number?: string | null
          lifecycle?: string | null
          manychat_id?: string | null
          notes?: string | null
          owner_id?: string
          phone?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      integration_sync_log: {
        Row: {
          created_at: string
          direction: string
          error: string | null
          event: string | null
          id: number
          payload: Json | null
          provider: string
          status: string
        }
        Insert: {
          created_at?: string
          direction: string
          error?: string | null
          event?: string | null
          id?: never
          payload?: Json | null
          provider?: string
          status?: string
        }
        Update: {
          created_at?: string
          direction?: string
          error?: string | null
          event?: string | null
          id?: never
          payload?: Json | null
          provider?: string
          status?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          owner_id: string
          payment_link_created_at: string | null
          payment_link_token: string | null
          reservation_id: string | null
          status: string
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          owner_id: string
          payment_link_created_at?: string | null
          payment_link_token?: string | null
          reservation_id?: string | null
          status?: string
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          owner_id?: string
          payment_link_created_at?: string | null
          payment_link_token?: string | null
          reservation_id?: string | null
          status?: string
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_enrollments: {
        Row: {
          created_at: string
          current_step_code: string | null
          customer_id: string
          exited_reason: string | null
          id: string
          journey_id: string
          paused_until: string | null
          reservation_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_step_code?: string | null
          customer_id: string
          exited_reason?: string | null
          id?: string
          journey_id: string
          paused_until?: string | null
          reservation_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_step_code?: string | null
          customer_id?: string
          exited_reason?: string | null
          id?: string
          journey_id?: string
          paused_until?: string | null
          reservation_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_enrollments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_enrollments_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "wa_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_enrollments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_inquiries: {
        Row: {
          bot_event: string | null
          bot_stage: string | null
          check_in: string | null
          check_out: string | null
          created_at: string
          email: string | null
          form_name: string | null
          guest_name: string | null
          guests: number | null
          id: string
          lead_id: string
          message: string | null
          nights: number | null
          owner_id: string
          page_url: string | null
          payload: Json | null
          phone: string | null
          property_id: string | null
          referrer: string | null
          source: string
          unit_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          bot_event?: string | null
          bot_stage?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          email?: string | null
          form_name?: string | null
          guest_name?: string | null
          guests?: number | null
          id?: string
          lead_id: string
          message?: string | null
          nights?: number | null
          owner_id: string
          page_url?: string | null
          payload?: Json | null
          phone?: string | null
          property_id?: string | null
          referrer?: string | null
          source: string
          unit_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          bot_event?: string | null
          bot_stage?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          email?: string | null
          form_name?: string | null
          guest_name?: string | null
          guests?: number | null
          id?: string
          lead_id?: string
          message?: string | null
          nights?: number | null
          owner_id?: string
          page_url?: string | null
          payload?: Json | null
          phone?: string | null
          property_id?: string | null
          referrer?: string | null
          source?: string
          unit_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_inquiries_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_inquiries_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          bot_stage: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          interest: string | null
          last_bot_event_at: string | null
          manychat_subscriber_id: string | null
          notes: string | null
          owner_id: string
          phone: string | null
          property_id: string | null
          source: Database["public"]["Enums"]["lead_source"]
          stage: Database["public"]["Enums"]["lead_stage"]
          updated_at: string
          warmth: string
        }
        Insert: {
          bot_stage?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          interest?: string | null
          last_bot_event_at?: string | null
          manychat_subscriber_id?: string | null
          notes?: string | null
          owner_id: string
          phone?: string | null
          property_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
          warmth?: string
        }
        Update: {
          bot_stage?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          interest?: string | null
          last_bot_event_at?: string | null
          manychat_subscriber_id?: string | null
          notes?: string | null
          owner_id?: string
          phone?: string | null
          property_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
          warmth?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      messages_log: {
        Row: {
          campaign_id: string | null
          created_at: string
          customer_id: string | null
          delivered_at: string | null
          direction: Database["public"]["Enums"]["msg_direction"]
          error: string | null
          id: string
          journey_step_id: string | null
          payload: Json
          phone: string | null
          read_at: string | null
          replied_at: string | null
          reservation_id: string | null
          status: Database["public"]["Enums"]["msg_status"]
          template_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          direction?: Database["public"]["Enums"]["msg_direction"]
          error?: string | null
          id?: string
          journey_step_id?: string | null
          payload?: Json
          phone?: string | null
          read_at?: string | null
          replied_at?: string | null
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["msg_status"]
          template_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          direction?: Database["public"]["Enums"]["msg_direction"]
          error?: string | null
          id?: string
          journey_step_id?: string | null
          payload?: Json
          phone?: string | null
          read_at?: string | null
          replied_at?: string | null
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["msg_status"]
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_log_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_log_journey_step_id_fkey"
            columns: ["journey_step_id"]
            isOneToOne: false
            referencedRelation: "wa_journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_log_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_log_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "wa_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          owner_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          owner_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_seasons: {
        Row: {
          created_at: string
          end_date: string
          id: string
          min_nights: number
          name: string
          nightly_rate: number
          owner_id: string
          property_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          min_nights?: number
          name: string
          nightly_rate?: number
          owner_id: string
          property_id: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          min_nights?: number
          name?: string
          nightly_rate?: number
          owner_id?: string
          property_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_seasons_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          adults: number
          beds24_booking_id: number | null
          beds24_status: string | null
          channel: Database["public"]["Enums"]["reservation_channel"]
          check_in: string
          check_out: string
          checkin_code: string | null
          children: number
          created_at: string
          customer_id: string | null
          guest_name: string
          id: string
          last_synced_at: string | null
          nights: number | null
          notes: string | null
          owner_id: string
          paid_amount: number
          phone: string | null
          rating: number | null
          review: string | null
          status: Database["public"]["Enums"]["reservation_status"]
          sync_source: string | null
          total_amount: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          adults?: number
          beds24_booking_id?: number | null
          beds24_status?: string | null
          channel?: Database["public"]["Enums"]["reservation_channel"]
          check_in: string
          check_out: string
          checkin_code?: string | null
          children?: number
          created_at?: string
          customer_id?: string | null
          guest_name: string
          id?: string
          last_synced_at?: string | null
          nights?: number | null
          notes?: string | null
          owner_id: string
          paid_amount?: number
          phone?: string | null
          rating?: number | null
          review?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          sync_source?: string | null
          total_amount?: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          adults?: number
          beds24_booking_id?: number | null
          beds24_status?: string | null
          channel?: Database["public"]["Enums"]["reservation_channel"]
          check_in?: string
          check_out?: string
          checkin_code?: string | null
          children?: number
          created_at?: string
          customer_id?: string | null
          guest_name?: string
          id?: string
          last_synced_at?: string | null
          nights?: number | null
          notes?: string | null
          owner_id?: string
          paid_amount?: number
          phone?: string | null
          rating?: number | null
          review?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          sync_source?: string | null
          total_amount?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          base_price: number
          beds24_property_id: number | null
          beds24_room_id: number | null
          capacity: number
          created_at: string
          id: string
          name: string
          notes: string | null
          owner_id: string
          property_id: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          beds24_property_id?: number | null
          beds24_room_id?: number | null
          capacity?: number
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          owner_id: string
          property_id: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          beds24_property_id?: number | null
          beds24_room_id?: number | null
          capacity?: number
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_journey_steps: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          journey_id: string
          mode: Database["public"]["Enums"]["wa_send_mode"]
          name_he: string
          order_index: number
          step_code: string
          template_id: string | null
          trigger_he: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          journey_id: string
          mode?: Database["public"]["Enums"]["wa_send_mode"]
          name_he: string
          order_index: number
          step_code: string
          template_id?: string | null
          trigger_he: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          journey_id?: string
          mode?: Database["public"]["Enums"]["wa_send_mode"]
          name_he?: string
          order_index?: number
          step_code?: string
          template_id?: string | null
          trigger_he?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_journey_steps_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "wa_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_journey_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "wa_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_journeys: {
        Row: {
          created_at: string
          description_he: string | null
          id: string
          is_active: boolean
          key: Database["public"]["Enums"]["journey_key"]
          name_he: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_he?: string | null
          id?: string
          is_active?: boolean
          key: Database["public"]["Enums"]["journey_key"]
          name_he: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_he?: string | null
          id?: string
          is_active?: boolean
          key?: Database["public"]["Enums"]["journey_key"]
          name_he?: string
          updated_at?: string
        }
        Relationships: []
      }
      wa_templates: {
        Row: {
          body_he: string
          category: Database["public"]["Enums"]["wa_template_category"]
          created_at: string
          id: string
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["wa_template_status"]
          updated_at: string
          variables: Json
        }
        Insert: {
          body_he: string
          category: Database["public"]["Enums"]["wa_template_category"]
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["wa_template_status"]
          updated_at?: string
          variables?: Json
        }
        Update: {
          body_he?: string
          category?: Database["public"]["Enums"]["wa_template_category"]
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["wa_template_status"]
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      campaign_status: "draft" | "scheduled" | "running" | "done" | "cancelled"
      journey_key: "leads" | "clients"
      lead_source:
        | "whatsapp"
        | "website"
        | "tzimmerer"
        | "instagram"
        | "referral"
        | "other"
      lead_stage: "new" | "contacted" | "quoted" | "booked" | "lost"
      msg_direction: "out" | "in"
      msg_status:
        | "queued"
        | "sent"
        | "delivered"
        | "read"
        | "failed"
        | "replied"
      reservation_channel:
        | "booking"
        | "direct"
        | "tzimmerer"
        | "airbnb"
        | "vrbo"
        | "block"
      reservation_status:
        | "pending"
        | "confirmed"
        | "checkin"
        | "checkout"
        | "cancelled"
      wa_send_mode: "in_window" | "template"
      wa_template_category: "utility" | "marketing"
      wa_template_status: "draft" | "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      campaign_status: ["draft", "scheduled", "running", "done", "cancelled"],
      journey_key: ["leads", "clients"],
      lead_source: [
        "whatsapp",
        "website",
        "tzimmerer",
        "instagram",
        "referral",
        "other",
      ],
      lead_stage: ["new", "contacted", "quoted", "booked", "lost"],
      msg_direction: ["out", "in"],
      msg_status: ["queued", "sent", "delivered", "read", "failed", "replied"],
      reservation_channel: [
        "booking",
        "direct",
        "tzimmerer",
        "airbnb",
        "vrbo",
        "block",
      ],
      reservation_status: [
        "pending",
        "confirmed",
        "checkin",
        "checkout",
        "cancelled",
      ],
      wa_send_mode: ["in_window", "template"],
      wa_template_category: ["utility", "marketing"],
      wa_template_status: ["draft", "pending", "approved", "rejected"],
    },
  },
} as const
