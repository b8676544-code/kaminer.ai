
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "calendar_connections": {
                  Row: {
                    "calendar_id": string,"calendar_name": string | null,"calendar_selected_at": string | null,"created_at": string,"google_email": string | null,"id": string,"last_sync_attempt_at": string | null,"last_sync_error": string | null,"last_synced_at": string | null,"refresh_token": string,"sync_lock_until": string | null,"sync_token": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "calendar_id"?: string,"calendar_name"?: string | null,"calendar_selected_at"?: string | null,"created_at"?: string,"google_email"?: string | null,"id"?: string,"last_sync_attempt_at"?: string | null,"last_sync_error"?: string | null,"last_synced_at"?: string | null,"refresh_token": string,"sync_lock_until"?: string | null,"sync_token"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "calendar_id"?: string,"calendar_name"?: string | null,"calendar_selected_at"?: string | null,"created_at"?: string,"google_email"?: string | null,"id"?: string,"last_sync_attempt_at"?: string | null,"last_sync_error"?: string | null,"last_synced_at"?: string | null,"refresh_token"?: string,"sync_lock_until"?: string | null,"sync_token"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "calendar_connections_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"client_contacts": {
                  Row: {
                    "client_id": string,"created_at": string,"email": string | null,"id": string,"mobile": string | null,"name": string,"notes": string | null,"owner_id": string,"phone": string | null,"role": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"created_at"?: string,"email"?: string | null,"id"?: string,"mobile"?: string | null,"name": string,"notes"?: string | null,"owner_id"?: string,"phone"?: string | null,"role"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "client_id"?: string,"created_at"?: string,"email"?: string | null,"id"?: string,"mobile"?: string | null,"name"?: string,"notes"?: string | null,"owner_id"?: string,"phone"?: string | null,"role"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "client_contacts_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "client_contacts_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"clients": {
                  Row: {
                    "contact_name": string | null,"created_at": string,"email": string | null,"hourly_rate": number | null,"id": string,"mobile": string | null,"name": string,"notes": string | null,"owner_id": string,"phone": string | null,"status": Database["public"]['Enums']["client_status"],"updated_at": string,"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "contact_name"?: string | null,"created_at"?: string,"email"?: string | null,"hourly_rate"?: number | null,"id"?: string,"mobile"?: string | null,"name": string,"notes"?: string | null,"owner_id"?: string,"phone"?: string | null,"status"?: Database["public"]['Enums']["client_status"],"updated_at"?: string,"website"?: string | null
                  }
                  Update: {
                    "contact_name"?: string | null,"created_at"?: string,"email"?: string | null,"hourly_rate"?: number | null,"id"?: string,"mobile"?: string | null,"name"?: string,"notes"?: string | null,"owner_id"?: string,"phone"?: string | null,"status"?: Database["public"]['Enums']["client_status"],"updated_at"?: string,"website"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "clients_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"freelancers": {
                  Row: {
                    "created_at": string,"default_hourly_cost": number | null,"email": string | null,"full_name": string,"id": string,"is_active": boolean,"notes": string | null,"owner_id": string,"phone": string | null,"profile_id": string | null,"specialty": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"default_hourly_cost"?: number | null,"email"?: string | null,"full_name": string,"id"?: string,"is_active"?: boolean,"notes"?: string | null,"owner_id"?: string,"phone"?: string | null,"profile_id"?: string | null,"specialty"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"default_hourly_cost"?: number | null,"email"?: string | null,"full_name"?: string,"id"?: string,"is_active"?: boolean,"notes"?: string | null,"owner_id"?: string,"phone"?: string | null,"profile_id"?: string | null,"specialty"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "freelancers_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "freelancers_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"meetings": {
                  Row: {
                    "client_id": string | null,"created_at": string,"deleted_at": string | null,"ends_at": string,"google_etag": string | null,"google_event_id": string | null,"id": string,"is_all_day": boolean,"is_personal": boolean,"last_synced_at": string | null,"location": string | null,"needs_push": boolean,"notes": string | null,"owner_id": string,"source": string,"starts_at": string,"task_id": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"ends_at": string,"google_etag"?: string | null,"google_event_id"?: string | null,"id"?: string,"is_all_day"?: boolean,"is_personal"?: boolean,"last_synced_at"?: string | null,"location"?: string | null,"needs_push"?: boolean,"notes"?: string | null,"owner_id"?: string,"source"?: string,"starts_at": string,"task_id"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "client_id"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"ends_at"?: string,"google_etag"?: string | null,"google_event_id"?: string | null,"id"?: string,"is_all_day"?: boolean,"is_personal"?: boolean,"last_synced_at"?: string | null,"location"?: string | null,"needs_push"?: boolean,"notes"?: string | null,"owner_id"?: string,"source"?: string,"starts_at"?: string,"task_id"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "meetings_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "meetings_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "meetings_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "task_time_summary"
      referencedColumns: ["task_id"]
    },{
      foreignKeyName: "meetings_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"full_name": string | null,"id": string,"role": Database["public"]['Enums']["user_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"full_name"?: string | null,"id": string,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string | null,"id"?: string,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Relationships: [
                    
                  ]
                },"projects": {
                  Row: {
                    "client_id": string,"created_at": string,"description": string | null,"end_date": string | null,"final_price": number | null,"hourly_rate": number | null,"id": string,"name": string,"owner_id": string,"pricing_type": Database["public"]['Enums']["pricing_type"] | null,"start_date": string | null,"status": Database["public"]['Enums']["project_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"created_at"?: string,"description"?: string | null,"end_date"?: string | null,"final_price"?: number | null,"hourly_rate"?: number | null,"id"?: string,"name": string,"owner_id"?: string,"pricing_type"?: Database["public"]['Enums']["pricing_type"] | null,"start_date"?: string | null,"status"?: Database["public"]['Enums']["project_status"],"updated_at"?: string
                  }
                  Update: {
                    "client_id"?: string,"created_at"?: string,"description"?: string | null,"end_date"?: string | null,"final_price"?: number | null,"hourly_rate"?: number | null,"id"?: string,"name"?: string,"owner_id"?: string,"pricing_type"?: Database["public"]['Enums']["pricing_type"] | null,"start_date"?: string | null,"status"?: Database["public"]['Enums']["project_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "projects_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"task_checklist_items": {
                  Row: {
                    "id": string,"is_done": boolean,"position": number,"task_id": string,"text": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"is_done"?: boolean,"position"?: number,"task_id": string,"text": string
                  }
                  Update: {
                    "id"?: string,"is_done"?: boolean,"position"?: number,"task_id"?: string,"text"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "task_checklist_items_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "task_time_summary"
      referencedColumns: ["task_id"]
    },{
      foreignKeyName: "task_checklist_items_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["id"]
    }
                  ]
                },"task_notes": {
                  Row: {
                    "author_id": string,"body": string,"created_at": string,"id": string,"task_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string,"body": string,"created_at"?: string,"id"?: string,"task_id": string
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"created_at"?: string,"id"?: string,"task_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "task_notes_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "task_notes_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "task_time_summary"
      referencedColumns: ["task_id"]
    },{
      foreignKeyName: "task_notes_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["id"]
    }
                  ]
                },"task_templates": {
                  Row: {
                    "category": Database["public"]['Enums']["task_category"],"checklist": NonNullable<Json>,"created_at": string,"default_estimate_minutes": number | null,"description": string | null,"id": string,"is_active": boolean,"owner_id": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category": Database["public"]['Enums']["task_category"],"checklist"?: NonNullable<Json>,"created_at"?: string,"default_estimate_minutes"?: number | null,"description"?: string | null,"id"?: string,"is_active"?: boolean,"owner_id"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "category"?: Database["public"]['Enums']["task_category"],"checklist"?: NonNullable<Json>,"created_at"?: string,"default_estimate_minutes"?: number | null,"description"?: string | null,"id"?: string,"is_active"?: boolean,"owner_id"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "task_templates_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"tasks": {
                  Row: {
                    "assignee_freelancer_id": string | null,"category": Database["public"]['Enums']["task_category"],"client_id": string | null,"completed_at": string | null,"created_at": string,"created_by": string,"description": string | null,"due_date": string | null,"estimate_minutes": number | null,"final_price": number | null,"freelancer_cost": number | null,"hourly_rate": number | null,"id": string,"owner_id": string,"pricing_type": Database["public"]['Enums']["pricing_type"] | null,"priority": Database["public"]['Enums']["task_priority"],"project_id": string | null,"recurrence_rule": string | null,"status": Database["public"]['Enums']["task_status"],"template_id": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assignee_freelancer_id"?: string | null,"category": Database["public"]['Enums']["task_category"],"client_id"?: string | null,"completed_at"?: string | null,"created_at"?: string,"created_by"?: string,"description"?: string | null,"due_date"?: string | null,"estimate_minutes"?: number | null,"final_price"?: number | null,"freelancer_cost"?: number | null,"hourly_rate"?: number | null,"id"?: string,"owner_id"?: string,"pricing_type"?: Database["public"]['Enums']["pricing_type"] | null,"priority"?: Database["public"]['Enums']["task_priority"],"project_id"?: string | null,"recurrence_rule"?: string | null,"status"?: Database["public"]['Enums']["task_status"],"template_id"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "assignee_freelancer_id"?: string | null,"category"?: Database["public"]['Enums']["task_category"],"client_id"?: string | null,"completed_at"?: string | null,"created_at"?: string,"created_by"?: string,"description"?: string | null,"due_date"?: string | null,"estimate_minutes"?: number | null,"final_price"?: number | null,"freelancer_cost"?: number | null,"hourly_rate"?: number | null,"id"?: string,"owner_id"?: string,"pricing_type"?: Database["public"]['Enums']["pricing_type"] | null,"priority"?: Database["public"]['Enums']["task_priority"],"project_id"?: string | null,"recurrence_rule"?: string | null,"status"?: Database["public"]['Enums']["task_status"],"template_id"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tasks_assignee_freelancer_id_fkey"
      columns: ["assignee_freelancer_id"]
isOneToOne: false
      referencedRelation: "freelancers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "task_templates"
      referencedColumns: ["id"]
    }
                  ]
                },"time_entries": {
                  Row: {
                    "created_at": string,"duration_minutes": number | null,"ended_at": string | null,"id": string,"is_billable": boolean,"is_manual": boolean,"meeting_id": string | null,"note": string | null,"started_at": string,"task_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"duration_minutes"?: number | null,"ended_at"?: string | null,"id"?: string,"is_billable"?: boolean,"is_manual"?: boolean,"meeting_id"?: string | null,"note"?: string | null,"started_at": string,"task_id": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"duration_minutes"?: number | null,"ended_at"?: string | null,"id"?: string,"is_billable"?: boolean,"is_manual"?: boolean,"meeting_id"?: string | null,"note"?: string | null,"started_at"?: string,"task_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "time_entries_meeting_id_fkey"
      columns: ["meeting_id"]
isOneToOne: false
      referencedRelation: "meetings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "time_entries_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "task_time_summary"
      referencedColumns: ["task_id"]
    },{
      foreignKeyName: "time_entries_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "time_entries_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "calendar_connection_status": {
                  Row: {
                    "calendar_id": string,"calendar_name": string | null,"calendar_selected_at": string | null,"created_at": string,"google_email": string | null,"last_sync_attempt_at": string | null,"last_sync_error": string | null,"last_synced_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                           "calendar_id"?: string | null,"calendar_name"?: string | null,"calendar_selected_at"?: string | null,"created_at"?: string | null,"google_email"?: string | null,"last_sync_attempt_at"?: string | null,"last_sync_error"?: string | null,"last_synced_at"?: string | null,"user_id"?: string | null
                         }
                        Update: {
                           "calendar_id"?: string | null,"calendar_name"?: string | null,"calendar_selected_at"?: string | null,"created_at"?: string | null,"google_email"?: string | null,"last_sync_attempt_at"?: string | null,"last_sync_error"?: string | null,"last_synced_at"?: string | null,"user_id"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "calendar_connections_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"client_monthly_hours": {
                  Row: {
                    "billable_minutes": number | null,"client_id": string | null,"month": string | null,"total_minutes": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "tasks_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    }
                  ]
                },"task_time_summary": {
                  Row: {
                    "actual_minutes": number | null,"estimate_minutes": number | null,"overrun_percent": number | null,"task_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "start_timer":
{ Args: { "p_task_id": string }; Returns: {
              "created_at": string,
"duration_minutes": number | null,
"ended_at": string | null,
"id": string,
"is_billable": boolean,
"is_manual": boolean,
"meeting_id": string | null,
"note": string | null,
"started_at": string,
"task_id": string,
"updated_at": string,
"user_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "time_entries"
        isOneToOne: true
        isSetofReturn: false
      } },
"stop_timer":
{ Args: { "p_ended_at"?: string }; Returns: {
              "created_at": string,
"duration_minutes": number | null,
"ended_at": string | null,
"id": string,
"is_billable": boolean,
"is_manual": boolean,
"meeting_id": string | null,
"note": string | null,
"started_at": string,
"task_id": string,
"updated_at": string,
"user_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "time_entries"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            "client_status": "active"|"archived","pricing_type": "hourly"|"fixed","project_status": "active"|"done"|"archived","task_category": "marketing"|"business"|"clients"|"personal","task_priority": "low"|"normal"|"urgent","task_status": "todo"|"in_progress"|"waiting_client"|"done","user_role": "owner"|"freelancer"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "client_status": ["active", "archived"],"pricing_type": ["hourly", "fixed"],"project_status": ["active", "done", "archived"],"task_category": ["marketing", "business", "clients", "personal"],"task_priority": ["low", "normal", "urgent"],"task_status": ["todo", "in_progress", "waiting_client", "done"],"user_role": ["owner", "freelancer"]
          }
        }
} as const
