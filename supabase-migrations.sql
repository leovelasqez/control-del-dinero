-- =============================================================
-- Funciones RPC para dashboard summary y gasto por categoria
-- Ejecutar en Supabase SQL Editor
-- =============================================================

-- Funcion: Resumen completo del dashboard
-- Retorna KPIs del mes actual/anterior, datos para graficas y historial
create or replace function get_dashboard_summary(p_user_id uuid)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'current_month', (
      select json_build_object(
        'income', coalesce(sum(case when type = 'ingreso' then amount else 0 end), 0),
        'expenses', coalesce(sum(case when type = 'gasto' then amount else 0 end), 0)
      )
      from transactions
      where user_id = p_user_id
        and date >= date_trunc('month', current_date)
        and date < date_trunc('month', current_date) + interval '1 month'
    ),
    'previous_month', (
      select json_build_object(
        'income', coalesce(sum(case when type = 'ingreso' then amount else 0 end), 0),
        'expenses', coalesce(sum(case when type = 'gasto' then amount else 0 end), 0)
      )
      from transactions
      where user_id = p_user_id
        and date >= date_trunc('month', current_date) - interval '1 month'
        and date < date_trunc('month', current_date)
    ),
    'monthly_chart', (
      select coalesce(json_agg(row_to_json(m) order by m.month), '[]'::json)
      from (
        select to_char(date, 'YYYY-MM') as month,
               sum(case when type = 'ingreso' then amount else 0 end) as ingresos,
               sum(case when type = 'gasto' then amount else 0 end) as gastos
        from transactions
        where user_id = p_user_id
        group by to_char(date, 'YYYY-MM')
      ) m
    ),
    'expense_by_category', (
      select coalesce(json_agg(row_to_json(c)), '[]'::json)
      from (
        select category as name, sum(amount) as value
        from transactions
        where user_id = p_user_id
          and type = 'gasto'
          and date >= date_trunc('month', current_date)
          and date < date_trunc('month', current_date) + interval '1 month'
        group by category
      ) c
    ),
    'history_monthly', (
      select coalesce(json_agg(row_to_json(h) order by h.month), '[]'::json)
      from (
        select
          to_char(date, 'YYYY-MM') as month,
          sum(case when type = 'ingreso' then amount else 0 end) as ingresos,
          sum(case when type = 'gasto' then amount else 0 end) as gastos
        from transactions
        where user_id = p_user_id
        group by to_char(date, 'YYYY-MM')
      ) h
    ),
    'history_categories', (
      select coalesce(json_agg(row_to_json(r) order by r.month), '[]'::json)
      from (
        select to_char(date, 'YYYY-MM') as month,
               category,
               sum(amount) as total
        from transactions
        where user_id = p_user_id and type = 'gasto'
        group by to_char(date, 'YYYY-MM'), category
      ) r
    )
  );
$$;

-- Funcion: Gasto del mes actual por categoria (para presupuestos)
create or replace function get_current_month_spent(p_user_id uuid)
returns json
language sql
security definer
set search_path = public
as $$
  select coalesce(
    json_object_agg(category, total),
    '{}'::json
  )
  from (
    select category, sum(amount) as total
    from transactions
    where user_id = p_user_id
      and type = 'gasto'
      and date >= date_trunc('month', current_date)
      and date < date_trunc('month', current_date) + interval '1 month'
    group by category
  ) s;
$$;
