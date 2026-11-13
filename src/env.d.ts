declare namespace App {
  interface Locals {
    supabase: import("@/lib/supabase").Supabase;
    claims: { sub: string; aal?: string; email?: string } | null;
  }
}
