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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bnpl_accounts: {
        Row: {
          balance_due: number
          created_at: string | null
          created_by: string | null
          credit_limit: number
          customer_name: string
          customer_phone: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["bnpl_account_status"]
          store_id: string
          updated_at: string | null
        }
        Insert: {
          balance_due?: number
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number
          customer_name: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["bnpl_account_status"]
          store_id: string
          updated_at?: string | null
        }
        Update: {
          balance_due?: number
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number
          customer_name?: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["bnpl_account_status"]
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bnpl_accounts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      bnpl_installments: {
        Row: {
          account_id: string
          amount: number
          created_at: string | null
          due_date: string
          id: string
          notes: string | null
          order_id: string | null
          status: Database["public"]["Enums"]["installment_status"]
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string | null
          due_date: string
          id?: string
          notes?: string | null
          order_id?: string | null
          status?: Database["public"]["Enums"]["installment_status"]
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          status?: Database["public"]["Enums"]["installment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bnpl_installments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bnpl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bnpl_installments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      bnpl_payments: {
        Row: {
          account_id: string
          amount_paid: number
          id: string
          installment_id: string
          notes: string | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          received_by: string | null
        }
        Insert: {
          account_id: string
          amount_paid: number
          id?: string
          installment_id: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          received_by?: string | null
        }
        Update: {
          account_id?: string
          amount_paid?: number
          id?: string
          installment_id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          received_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bnpl_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bnpl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bnpl_payments_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "bnpl_installments"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
          sort_order: number
          store_id: string
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
          store_id: string
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_revoked: boolean
          max_uses: number
          note: string | null
          role: Database["public"]["Enums"]["member_role"] | null
          store_id: string | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_revoked?: boolean
          max_uses?: number
          note?: string | null
          role?: Database["public"]["Enums"]["member_role"] | null
          store_id?: string | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_revoked?: boolean
          max_uses?: number
          note?: string | null
          role?: Database["public"]["Enums"]["member_role"] | null
          store_id?: string | null
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_invite_store"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      lot_consumptions: {
        Row: {
          created_at: string
          id: string
          lot_id: string
          order_item_id: string
          quantity: number
          unit_cost_snapshot: number
        }
        Insert: {
          created_at?: string
          id?: string
          lot_id: string
          order_item_id: string
          quantity: number
          unit_cost_snapshot: number
        }
        Update: {
          created_at?: string
          id?: string
          lot_id?: string
          order_item_id?: string
          quantity?: number
          unit_cost_snapshot?: number
        }
        Relationships: [
          {
            foreignKeyName: "lot_consumptions_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "purchase_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_consumptions_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          discount: number
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_cost: number | null
          unit_price: number
        }
        Insert: {
          discount?: number
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_cost?: number | null
          unit_price: number
        }
        Update: {
          discount?: number
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
          unit_cost?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_tendered: number | null
          bnpl_account_id: string | null
          cashier_id: string | null
          change_amount: number | null
          created_at: string
          discount: number
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          qr_channel_id: string | null
          qr_reference: string | null
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal: number
          tax_amount: number
          total: number
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount_tendered?: number | null
          bnpl_account_id?: string | null
          cashier_id?: string | null
          change_amount?: number | null
          created_at?: string
          discount?: number
          id?: string
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          qr_channel_id?: string | null
          qr_reference?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal: number
          tax_amount?: number
          total: number
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount_tendered?: number | null
          bnpl_account_id?: string | null
          cashier_id?: string | null
          change_amount?: number | null
          created_at?: string
          discount?: number
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          qr_channel_id?: string | null
          qr_reference?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_bnpl_account_id_fkey"
            columns: ["bnpl_account_id"]
            isOneToOne: false
            referencedRelation: "bnpl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_qr_channel_id_fkey"
            columns: ["qr_channel_id"]
            isOneToOne: false
            referencedRelation: "qr_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category_id: string | null
          cost_price: number | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          low_stock_at: number
          name: string
          price: number
          sku: string | null
          stock_qty: number
          store_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          low_stock_at?: number
          name: string
          price: number
          sku?: string | null
          stock_qty?: number
          store_id: string
          unit?: string
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          low_stock_at?: number
          name?: string
          price?: number
          sku?: string | null
          stock_qty?: number
          store_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          is_provisioned: boolean
          is_super_admin: boolean
          is_suspended: boolean
          store_limit_override: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_provisioned?: boolean
          is_super_admin?: boolean
          is_suspended?: boolean
          store_limit_override?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_provisioned?: boolean
          is_super_admin?: boolean
          is_suspended?: boolean
          store_limit_override?: number | null
        }
        Relationships: []
      }
      purchase_lots: {
        Row: {
          created_by: string | null
          id: string
          notes: string | null
          product_id: string
          received_at: string
          received_qty: number
          remaining_qty: number
          source_ref: string | null
          store_id: string
          unit_cost: number
        }
        Insert: {
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id: string
          received_at?: string
          received_qty: number
          remaining_qty: number
          source_ref?: string | null
          store_id: string
          unit_cost?: number
        }
        Update: {
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          received_at?: string
          received_qty?: number
          remaining_qty?: number
          source_ref?: string | null
          store_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_lots_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_channels: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          image_url: string
          is_enabled: boolean
          label: string
          sort_order: number
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url: string
          is_enabled?: boolean
          label: string
          sort_order?: number
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string
          is_enabled?: boolean
          label?: string
          sort_order?: number
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_channels_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      stock_adjustments: {
        Row: {
          adjusted_by: string | null
          created_at: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          reason: Database["public"]["Enums"]["adjustment_reason"]
          store_id: string
        }
        Insert: {
          adjusted_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          reason: Database["public"]["Enums"]["adjustment_reason"]
          store_id: string
        }
        Update: {
          adjusted_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reason?: Database["public"]["Enums"]["adjustment_reason"]
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role: Database["public"]["Enums"]["member_role"]
          store_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          store_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_members_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          cost_method: Database["public"]["Enums"]["inventory_cost_method"]
          created_at: string
          currency_code: string
          currency_decimals: number
          currency_symbol: string
          id: string
          is_suspended: boolean
          logo_url: string | null
          name: string
          owner_id: string
          receipt_footer: string | null
          receipt_header: string | null
          staff_limit_override: number | null
          symbol_position: Database["public"]["Enums"]["currency_symbol_position"]
          tax_rate: number
        }
        Insert: {
          address?: string | null
          cost_method?: Database["public"]["Enums"]["inventory_cost_method"]
          created_at?: string
          currency_code?: string
          currency_decimals?: number
          currency_symbol?: string
          id?: string
          is_suspended?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          receipt_footer?: string | null
          receipt_header?: string | null
          staff_limit_override?: number | null
          symbol_position?: Database["public"]["Enums"]["currency_symbol_position"]
          tax_rate?: number
        }
        Update: {
          address?: string | null
          cost_method?: Database["public"]["Enums"]["inventory_cost_method"]
          created_at?: string
          currency_code?: string
          currency_decimals?: number
          currency_symbol?: string
          id?: string
          is_suspended?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          receipt_footer?: string | null
          receipt_header?: string | null
          staff_limit_override?: number | null
          symbol_position?: Database["public"]["Enums"]["currency_symbol_position"]
          tax_rate?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: {
        Args: { p_store_id: string }
        Returns: Database["public"]["Enums"]["member_role"]
      }
      invite_staff_by_email: {
        Args: {
          p_email: string
          p_note?: string
          p_role: Database["public"]["Enums"]["member_role"]
          p_store_id: string
        }
        Returns: {
          invited_user_id: string
          message: string
          status: string
        }[]
      }
      is_current_user_super_admin: { Args: never; Returns: boolean }
      paginated_bnpl_accounts: {
        Args: {
          p_balance_statuses?: string[]
          p_page?: number
          p_page_size?: number
          p_query?: string
          p_statuses?: string[]
          p_store_id: string
        }
        Returns: {
          balance_due: number
          created_at: string
          credit_limit: number
          customer_name: string
          customer_phone: string
          id: string
          notes: string
          status: string
          total_count: number
        }[]
      }
      paginated_orders: {
        Args: {
          p_methods?: string[]
          p_page?: number
          p_page_size?: number
          p_query?: string
          p_statuses?: string[]
          p_store_id: string
        }
        Returns: {
          cashier_id: string
          created_at: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          status: Database["public"]["Enums"]["order_status"]
          total: number
          total_count: number
        }[]
      }
      paginated_products: {
        Args: {
          p_category_ids?: string[]
          p_page?: number
          p_page_size?: number
          p_query?: string
          p_statuses?: string[]
          p_stock_statuses?: string[]
          p_store_id: string
        }
        Returns: {
          barcode: string
          category_id: string
          category_name: string
          cost_price: number
          id: string
          image_url: string
          is_active: boolean
          low_stock_at: number
          name: string
          price: number
          sku: string
          stock_qty: number
          total_count: number
          unit: string
        }[]
      }
      process_order_stock: { Args: { p_order_id: string }; Returns: undefined }
    }
    Enums: {
      adjustment_reason:
        | "purchase"
        | "return"
        | "damage"
        | "loss"
        | "correction"
        | "initial"
      bnpl_account_status: "active" | "frozen" | "closed" | "settled"
      currency_symbol_position: "prefix" | "suffix"
      installment_status: "pending" | "paid" | "waived"
      inventory_cost_method: "fifo" | "lifo"
      member_role: "owner" | "manager" | "cashier" | "viewer"
      order_status: "completed" | "voided" | "refunded"
      payment_method: "cash" | "qr_transfer" | "card" | "split" | "bnpl"
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
      adjustment_reason: [
        "purchase",
        "return",
        "damage",
        "loss",
        "correction",
        "initial",
      ],
      bnpl_account_status: ["active", "frozen", "closed", "settled"],
      currency_symbol_position: ["prefix", "suffix"],
      installment_status: ["pending", "paid", "waived"],
      inventory_cost_method: ["fifo", "lifo"],
      member_role: ["owner", "manager", "cashier", "viewer"],
      order_status: ["completed", "voided", "refunded"],
      payment_method: ["cash", "qr_transfer", "card", "split", "bnpl"],
    },
  },
} as const
