export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agenda_item_presets: {
        Row: {
          church_id: string
          created_at: string
          description: string | null
          duration_seconds: number
          id: string
          is_active: boolean
          ministry_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          church_id: string
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          is_active?: boolean
          ministry_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          church_id?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          is_active?: boolean
          ministry_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_item_presets_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_item_presets_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_item_templates: {
        Row: {
          church_id: string
          created_at: string | null
          default_duration_minutes: number
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          church_id: string
          created_at?: string | null
          default_duration_minutes?: number
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          church_id?: string
          created_at?: string | null
          default_duration_minutes?: number
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_item_templates_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_tokens: {
        Row: {
          church_id: string
          created_at: string | null
          id: string
          profile_id: string
          token: string
          updated_at: string | null
        }
        Insert: {
          church_id: string
          created_at?: string | null
          id?: string
          profile_id: string
          token: string
          updated_at?: string | null
        }
        Update: {
          church_id?: string
          created_at?: string | null
          id?: string
          profile_id?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_tokens_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campuses: {
        Row: {
          address: string | null
          church_id: string
          city: string | null
          color: string | null
          country: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          church_id: string
          city?: string | null
          color?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          church_id?: string
          city?: string | null
          color?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campuses_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      churches: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          default_event_visibility: string
          email: string | null
          first_day_of_week: number
          id: string
          join_code: string
          links_page_enabled: boolean
          logo_url: string | null
          name: string
          phone: string | null
          state: string | null
          subdomain: string
          time_format: string
          timezone: string | null
          updated_at: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          default_event_visibility?: string
          email?: string | null
          first_day_of_week?: number
          id?: string
          join_code: string
          links_page_enabled?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          state?: string | null
          subdomain: string
          time_format?: string
          timezone?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          default_event_visibility?: string
          email?: string | null
          first_day_of_week?: number
          id?: string
          join_code?: string
          links_page_enabled?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          subdomain?: string
          time_format?: string
          timezone?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      event_agenda_items: {
        Row: {
          arrangement_id: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number
          event_id: string
          id: string
          is_song_placeholder: boolean
          leader_id: string | null
          ministry_id: string | null
          song_id: string | null
          song_key: string | null
          sort_order: number
          title: string
          updated_at: string | null
        }
        Insert: {
          arrangement_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number
          event_id: string
          id?: string
          is_song_placeholder?: boolean
          leader_id?: string | null
          ministry_id?: string | null
          song_id?: string | null
          song_key?: string | null
          sort_order?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          arrangement_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number
          event_id?: string
          id?: string
          is_song_placeholder?: boolean
          leader_id?: string | null
          ministry_id?: string | null
          song_id?: string | null
          song_key?: string | null
          sort_order?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_agenda_items_arrangement_id_fkey"
            columns: ["arrangement_id"]
            isOneToOne: false
            referencedRelation: "song_arrangements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_agenda_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_agenda_items_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_agenda_items_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_agenda_items_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      event_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          invited_at: string | null
          notes: string | null
          position_id: string
          profile_id: string
          responded_at: string | null
          status: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          invited_at?: string | null
          notes?: string | null
          position_id: string
          profile_id: string
          responded_at?: string | null
          status?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          invited_at?: string | null
          notes?: string | null
          position_id?: string
          profile_id?: string
          responded_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assignments_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "event_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_campuses: {
        Row: {
          campus_id: string
          event_id: string
          id: string
        }
        Insert: {
          campus_id: string
          event_id: string
          id?: string
        }
        Update: {
          campus_id?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_campuses_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_campuses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invitations: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          profile_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invitations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_positions: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          ministry_id: string
          notes: string | null
          quantity_needed: number
          role_id: string | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          ministry_id: string
          notes?: string | null
          quantity_needed?: number
          role_id?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          ministry_id?: string
          notes?: string | null
          quantity_needed?: number
          role_id?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_positions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_positions_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_positions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "ministry_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_template_agenda_items: {
        Row: {
          created_at: string | null
          description: string | null
          duration_seconds: number
          id: string
          is_song_placeholder: boolean | null
          ministry_id: string | null
          sort_order: number
          template_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_seconds?: number
          id?: string
          is_song_placeholder?: boolean | null
          ministry_id?: string | null
          sort_order?: number
          template_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_seconds?: number
          id?: string
          is_song_placeholder?: boolean | null
          ministry_id?: string | null
          sort_order?: number
          template_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_template_agenda_items_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_template_agenda_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "event_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      event_template_positions: {
        Row: {
          created_at: string | null
          id: string
          ministry_id: string
          notes: string | null
          quantity_needed: number
          role_id: string | null
          sort_order: number | null
          template_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ministry_id: string
          notes?: string | null
          quantity_needed?: number
          role_id?: string | null
          sort_order?: number | null
          template_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ministry_id?: string
          notes?: string | null
          quantity_needed?: number
          role_id?: string | null
          sort_order?: number | null
          template_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_template_positions_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_template_positions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "ministry_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_template_positions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "event_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      event_templates: {
        Row: {
          campus_id: string | null
          church_id: string
          created_at: string | null
          created_by: string | null
          default_duration_minutes: number
          default_start_time: string
          description: string | null
          event_type: string
          id: string
          is_active: boolean | null
          location_id: string | null
          name: string
          responsible_person_id: string | null
          updated_at: string | null
          visibility: string
        }
        Insert: {
          campus_id?: string | null
          church_id: string
          created_at?: string | null
          created_by?: string | null
          default_duration_minutes?: number
          default_start_time: string
          description?: string | null
          event_type: string
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          name: string
          responsible_person_id?: string | null
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          campus_id?: string | null
          church_id?: string
          created_at?: string | null
          created_by?: string | null
          default_duration_minutes?: number
          default_start_time?: string
          description?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          name?: string
          responsible_person_id?: string | null
          updated_at?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_templates_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_templates_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_templates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_templates_responsible_person_id_fkey"
            columns: ["responsible_person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          church_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string
          event_type: string
          id: string
          is_all_day: boolean | null
          location: string | null
          location_id: string | null
          responsible_person_id: string | null
          start_time: string
          status: string
          title: string
          updated_at: string | null
          visibility: string
        }
        Insert: {
          church_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time: string
          event_type: string
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          location_id?: string | null
          responsible_person_id?: string | null
          start_time: string
          status?: string
          title: string
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          church_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string
          event_type?: string
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          location_id?: string | null
          responsible_person_id?: string | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_responsible_person_id_fkey"
            columns: ["responsible_person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      form_conditions: {
        Row: {
          action: string
          created_at: string | null
          form_id: string
          id: string
          operator: string
          source_field_id: string
          target_field_id: string
          value: string | null
        }
        Insert: {
          action?: string
          created_at?: string | null
          form_id: string
          id?: string
          operator: string
          source_field_id: string
          target_field_id: string
          value?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          form_id?: string
          id?: string
          operator?: string
          source_field_id?: string
          target_field_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_conditions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_conditions_source_field_id_fkey"
            columns: ["source_field_id"]
            isOneToOne: false
            referencedRelation: "form_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_conditions_target_field_id_fkey"
            columns: ["target_field_id"]
            isOneToOne: false
            referencedRelation: "form_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      form_fields: {
        Row: {
          created_at: string | null
          description: string | null
          form_id: string
          id: string
          label: string
          options: Json | null
          placeholder: string | null
          required: boolean | null
          settings: Json | null
          sort_order: number
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          form_id: string
          id?: string
          label: string
          options?: Json | null
          placeholder?: string | null
          required?: boolean | null
          settings?: Json | null
          sort_order?: number
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          form_id?: string
          id?: string
          label?: string
          options?: Json | null
          placeholder?: string | null
          required?: boolean | null
          settings?: Json | null
          sort_order?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          form_id: string
          id: string
          ip_address: unknown
          respondent_email: string | null
          respondent_id: string | null
          responses: Json
          submitted_at: string | null
          user_agent: string | null
        }
        Insert: {
          form_id: string
          id?: string
          ip_address?: unknown
          respondent_email?: string | null
          respondent_id?: string | null
          responses: Json
          submitted_at?: string | null
          user_agent?: string | null
        }
        Update: {
          form_id?: string
          id?: string
          ip_address?: unknown
          respondent_email?: string | null
          respondent_id?: string | null
          responses?: Json
          submitted_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          access_type: string
          church_id: string
          closed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          public_token: string | null
          published_at: string | null
          settings: Json | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          access_type?: string
          church_id: string
          closed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          public_token?: string | null
          published_at?: string | null
          settings?: Json | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          access_type?: string
          church_id?: string
          closed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          public_token?: string | null
          published_at?: string | null
          settings?: Json | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forms_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      link_tree_clicks: {
        Row: {
          church_id: string
          clicked_at: string | null
          id: string
          ip_address: unknown
          link_id: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          church_id: string
          clicked_at?: string | null
          id?: string
          ip_address?: unknown
          link_id: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          church_id?: string
          clicked_at?: string | null
          id?: string
          ip_address?: unknown
          link_id?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_tree_clicks_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_tree_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "link_tree_links"
            referencedColumns: ["id"]
          },
        ]
      }
      link_tree_links: {
        Row: {
          card_color: string | null
          card_size: string | null
          church_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          hide_label: boolean | null
          hover_effect: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          label_bold: boolean | null
          label_italic: boolean | null
          label_underline: boolean | null
          sort_order: number
          start_date: string | null
          text_color: string | null
          title: string
          updated_at: string | null
          url: string
          visibility: string
        }
        Insert: {
          card_color?: string | null
          card_size?: string | null
          church_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          hide_label?: boolean | null
          hover_effect?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          label_bold?: boolean | null
          label_italic?: boolean | null
          label_underline?: boolean | null
          sort_order?: number
          start_date?: string | null
          text_color?: string | null
          title: string
          updated_at?: string | null
          url: string
          visibility?: string
        }
        Update: {
          card_color?: string | null
          card_size?: string | null
          church_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          hide_label?: boolean | null
          hover_effect?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          label_bold?: boolean | null
          label_italic?: boolean | null
          label_underline?: boolean | null
          sort_order?: number
          start_date?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string | null
          url?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_tree_links_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_tree_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      link_tree_settings: {
        Row: {
          avatar_url: string | null
          background_color: string | null
          background_gradient_end: string | null
          background_gradient_start: string | null
          bio: string | null
          card_border_radius: string | null
          card_style: string | null
          church_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          meta_description: string | null
          meta_title: string | null
          show_church_name: boolean | null
          social_links: Json | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          background_color?: string | null
          background_gradient_end?: string | null
          background_gradient_start?: string | null
          bio?: string | null
          card_border_radius?: string | null
          card_style?: string | null
          church_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          show_church_name?: boolean | null
          social_links?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          background_color?: string | null
          background_gradient_end?: string | null
          background_gradient_start?: string | null
          bio?: string | null
          card_border_radius?: string | null
          card_style?: string | null
          church_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          show_church_name?: boolean | null
          social_links?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_tree_settings_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: true
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          campus_id: string | null
          church_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          campus_id?: string | null
          church_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          campus_id?: string | null
          church_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      ministries: {
        Row: {
          campus_id: string | null
          church_id: string
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          leader_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          campus_id?: string | null
          church_id: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          leader_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          campus_id?: string | null
          church_id?: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          leader_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministries_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministries_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministries_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ministry_member_roles: {
        Row: {
          assigned_at: string | null
          id: string
          member_id: string
          role_id: string
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          member_id: string
          role_id: string
        }
        Update: {
          assigned_at?: string | null
          id?: string
          member_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministry_member_roles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "ministry_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministry_member_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "ministry_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      ministry_members: {
        Row: {
          id: string
          is_active: boolean | null
          joined_at: string | null
          ministry_id: string
          notes: string | null
          profile_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          ministry_id: string
          notes?: string | null
          profile_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          ministry_id?: string
          notes?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministry_members_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministry_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ministry_roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          ministry_id: string
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          ministry_id: string
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          ministry_id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ministry_roles_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_taken: string | null
          actioned_at: string | null
          assignment_id: string | null
          church_id: string
          created_at: string | null
          email_token: string | null
          event_id: string | null
          expires_at: string | null
          id: string
          is_actioned: boolean | null
          is_read: boolean | null
          message: string | null
          read_at: string | null
          recipient_id: string
          task_id: string | null
          title: string
          type: string
        }
        Insert: {
          action_taken?: string | null
          actioned_at?: string | null
          assignment_id?: string | null
          church_id: string
          created_at?: string | null
          email_token?: string | null
          event_id?: string | null
          expires_at?: string | null
          id?: string
          is_actioned?: boolean | null
          is_read?: boolean | null
          message?: string | null
          read_at?: string | null
          recipient_id: string
          task_id?: string | null
          title: string
          type: string
        }
        Update: {
          action_taken?: string | null
          actioned_at?: string | null
          assignment_id?: string | null
          church_id?: string
          created_at?: string | null
          email_token?: string | null
          event_id?: string | null
          expires_at?: string | null
          id?: string
          is_actioned?: boolean | null
          is_read?: boolean | null
          message?: string | null
          read_at?: string | null
          recipient_id?: string
          task_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "event_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_registrations: {
        Row: {
          campus_id: string | null
          church_id: string
          created_at: string
          date_of_birth: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          linked_profile_id: string | null
          phone: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sex: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campus_id?: string | null
          church_id: string
          created_at?: string
          date_of_birth?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          linked_profile_id?: string | null
          phone?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sex?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campus_id?: string | null
          church_id?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          linked_profile_id?: string | null
          phone?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sex?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_registrations_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_registrations_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_registrations_linked_profile_id_fkey"
            columns: ["linked_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_registrations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_campuses: {
        Row: {
          assigned_at: string | null
          campus_id: string
          id: string
          is_primary: boolean | null
          profile_id: string
        }
        Insert: {
          assigned_at?: string | null
          campus_id: string
          id?: string
          is_primary?: boolean | null
          profile_id: string
        }
        Update: {
          assigned_at?: string | null
          campus_id?: string
          id?: string
          is_primary?: boolean | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_campuses_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_campuses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          baptism: boolean
          baptism_date: string | null
          bio: string | null
          church_id: string
          created_at: string
          date_of_birth: string | null
          date_of_departure: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          id: string
          last_name: string
          member_type: string
          notification_preferences: Json | null
          phone: string | null
          reason_for_departure: string | null
          receive_email_notifications: boolean | null
          receive_push_notifications: boolean | null
          role: string
          sex: string | null
          skills: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          baptism?: boolean
          baptism_date?: string | null
          bio?: string | null
          church_id: string
          created_at?: string
          date_of_birth?: string | null
          date_of_departure?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          id: string
          last_name: string
          member_type?: string
          notification_preferences?: Json | null
          phone?: string | null
          reason_for_departure?: string | null
          receive_email_notifications?: boolean | null
          receive_push_notifications?: boolean | null
          role?: string
          sex?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          baptism?: boolean
          baptism_date?: string | null
          bio?: string | null
          church_id?: string
          created_at?: string
          date_of_birth?: string | null
          date_of_departure?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          id?: string
          last_name?: string
          member_type?: string
          notification_preferences?: Json | null
          phone?: string | null
          reason_for_departure?: string | null
          receive_email_notifications?: boolean | null
          receive_push_notifications?: boolean | null
          role?: string
          sex?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_views: {
        Row: {
          church_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          filter_state: Json
          group_by: string | null
          id: string
          is_default: boolean
          name: string
          sort_state: Json
          updated_at: string | null
          view_type: string
        }
        Insert: {
          church_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          filter_state?: Json
          group_by?: string | null
          id?: string
          is_default?: boolean
          name: string
          sort_state?: Json
          updated_at?: string | null
          view_type: string
        }
        Update: {
          church_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          filter_state?: Json
          group_by?: string | null
          id?: string
          is_default?: boolean
          name?: string
          sort_state?: Json
          updated_at?: string | null
          view_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_views_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_views_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      song_arrangement_sections: {
        Row: {
          arrangement_id: string
          created_at: string
          id: string
          section_id: string
          sort_order: number
        }
        Insert: {
          arrangement_id: string
          created_at?: string
          id?: string
          section_id: string
          sort_order?: number
        }
        Update: {
          arrangement_id?: string
          created_at?: string
          id?: string
          section_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "song_arrangement_sections_arrangement_id_fkey"
            columns: ["arrangement_id"]
            isOneToOne: false
            referencedRelation: "song_arrangements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_arrangement_sections_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "song_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      song_arrangements: {
        Row: {
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          id: string
          is_default: boolean | null
          name: string
          song_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          is_default?: boolean | null
          name: string
          song_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          is_default?: boolean | null
          name?: string
          song_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_arrangements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_arrangements_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      song_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          song_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          song_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          song_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "song_attachments_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      song_sections: {
        Row: {
          created_at: string
          id: string
          label: string | null
          lyrics: string
          section_number: number | null
          section_type: string
          song_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          lyrics: string
          section_number?: number | null
          section_type: string
          song_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          lyrics?: string
          section_number?: number | null
          section_type?: string
          song_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_sections_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      song_tag_assignments: {
        Row: {
          id: string
          song_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          song_id: string
          tag_id: string
        }
        Update: {
          id?: string
          song_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_tag_assignments_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "song_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      song_tags: {
        Row: {
          church_id: string
          color: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          church_id: string
          color?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          church_id?: string
          color?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_tags_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          artist: string | null
          church_id: string
          created_at: string
          created_by: string | null
          default_key: string | null
          duration_seconds: number | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          artist?: string | null
          church_id: string
          created_at?: string
          created_by?: string | null
          default_key?: string | null
          duration_seconds?: number | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          artist?: string | null
          church_id?: string
          created_at?: string
          created_by?: string | null
          default_key?: string | null
          duration_seconds?: number | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "songs_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          activity_type: string
          author_id: string
          content: string
          created_at: string | null
          id: string
          new_value: string | null
          old_value: string | null
          task_id: string
        }
        Insert: {
          activity_type?: string
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id: string
        }
        Update: {
          activity_type?: string
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          campus_id: string | null
          church_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          event_id: string | null
          id: string
          ministry_id: string | null
          priority: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          campus_id?: string | null
          church_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          ministry_id?: string | null
          priority?: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          campus_id?: string | null
          church_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          ministry_id?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_unavailability: {
        Row: {
          church_id: string
          created_at: string | null
          end_date: string
          id: string
          profile_id: string
          reason: string | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          church_id: string
          created_at?: string | null
          end_date: string
          id?: string
          profile_id: string
          reason?: string | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          church_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          profile_id?: string
          reason?: string | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_unavailability_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_unavailability_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expire_past_event_invitations: { Args: never; Returns: undefined }
      generate_alphanumeric_code: { Args: { length?: number }; Returns: string }
      generate_unique_join_code: { Args: never; Returns: string }
      get_default_campus_id: {
        Args: { target_church_id: string }
        Returns: string
      }
      get_user_campus_ids: { Args: never; Returns: string[] }
      get_user_church_id: { Args: never; Returns: string }
      get_user_profile_id: { Args: never; Returns: string }
      is_admin_or_owner: { Args: never; Returns: boolean }
      is_leader_or_above: { Args: never; Returns: boolean }
      user_has_event_campus_access: {
        Args: { target_event_id: string }
        Returns: boolean
      }
      user_has_ministry_campus_access: {
        Args: { target_ministry_id: string }
        Returns: boolean
      }
      user_has_template_campus_access: {
        Args: { target_template_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

