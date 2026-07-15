# Disposable local database

This directory contains one independent final-state foundation migration, not research history. Use `supabase start`, `supabase db reset`, and `pnpm test:database` only against the generated repository's disposable local project. The test runner rejects a missing plan, zero tests, partial passes, and pgTAP failures. A real shared or production target requires a reviewed migration plan and explicit approval.

The generated local project uses API/DB/Studio/Mail ports `55321/55322/55323/55324` so it can coexist with a research environment on the default local ports. Realtime, Storage, Edge Runtime and local log Analytics are safe-disabled because the baseline retains no contract for them. Enable one only after the product specification and integration checks require it.

The retained schema covers owner profiles plus trusted Billing, Credit, Usage and Payment facts. Product tables and storage policies belong to the product repository when its specification exists.
