# ICM-IA — HABIT TRACK · Diseño

**Nombre de la app:** ICM-IA — HABIT TRACK
**Fecha:** 2026-08-06
**Estado:** Aprobado (diseño) — pendiente plan de implementación
**Origen:** Migración de una plantilla de Google Sheets a una web app.

## Objetivo

Reemplazar el seguimiento de hábitos que hoy vive en un Google Sheets (plantilla
comprada, con pestaña de instrucciones + metas + vista mensual) por una web app
personal, mobile-first, que sincroniza entre dispositivos.

## Decisiones tomadas (brainstorming)

- **Sincronización:** multi-dispositivo (celular ↔ computadora). Descarta `localStorage`.
- **Dispositivo principal:** celular → diseño **mobile-first**, instalable como PWA.
- **Datos iniciales:** empezar de cero (el usuario crea sus hábitos desde la UI).
  No se migra el historial del Sheet.
- **Login:** con Google (cuenta Gmail del usuario).
- **Backend:** Supabase (Postgres + Auth + Realtime). Descartado Firebase y
  usar el Sheet como backend.
- **Paleta:** negro + blanco + rojo (dark mode total).

## Arquitectura

```
[ React + TS (Vite) ]  ←→  [ Supabase ]
   PWA mobile-first          - Auth (Google OAuth)
   Chart.js                  - Postgres (datos del usuario)
   deploy en Vercel          - Realtime (sync entre dispositivos)
                             - Row Level Security (aislamiento por usuario)
```

- **Frontend:** React + TypeScript con Vite. PWA instalable (manifest + service
  worker) para que en el celular se sienta app nativa: ícono en home, pantalla
  completa.
- **Backend:** Supabase. Sin servidor propio; el cliente habla directo con la
  base vía la librería `@supabase/supabase-js`, protegido por Row Level Security
  (cada usuario solo accede a sus propias filas: `auth.uid() = user_id`).
- **Sync en tiempo real:** suscripción Realtime a las tablas del usuario para
  reflejar cambios sin recargar.
- **Hosting:** Vercel (free tier, deploy automático desde el repo).

## Modelo de datos

Dos tablas en Postgres. Rachas y estadísticas se **calculan en el cliente** a
partir de estos datos; no se persisten (evita desincronización).

### Tabla `habits`

| campo       | tipo      | notas                                          |
|-------------|-----------|------------------------------------------------|
| id          | uuid (PK) | `default gen_random_uuid()`                    |
| user_id     | uuid      | FK a `auth.users`; dueño del hábito            |
| name        | text      | ej. "Gimnasio"                                 |
| type        | text      | `daily` o `weekly`                             |
| goal        | int       | daily → días/mes; weekly → días/semana         |
| color       | text      | color del hábito (para UI)                     |
| sort_order  | int       | orden de la lista                              |
| archived    | boolean   | oculta el hábito sin borrar su historial       |
| created_at  | timestamptz | `default now()`                              |

### Tabla `completions`

Un renglón por día marcado. Su existencia = hábito hecho ese día.

| campo       | tipo      | notas                                          |
|-------------|-----------|------------------------------------------------|
| id          | uuid (PK) | `default gen_random_uuid()`                    |
| user_id     | uuid      | FK a `auth.users`                              |
| habit_id    | uuid      | FK a `habits` (on delete cascade)              |
| date        | date      | `YYYY-MM-DD`                                    |
| created_at  | timestamptz | `default now()`                              |

Restricción: `unique (habit_id, date)`.

### Row Level Security

En ambas tablas, políticas para `select/insert/update/delete` que exigen
`auth.uid() = user_id`. Al insertar, `user_id` se setea con `auth.uid()`.

## Pantallas (mobile-first, barra de tabs inferior)

1. **📊 Dashboard**
   - Bloque **"Hoy"** arriba: hábitos del día con botones grandes para marcar de
     un toque.
   - Stats: total de hábitos, completados hoy, racha máxima (🔥), progreso del mes.
   - Gráfico lineal de progreso (Chart.js).
   - Top 10 mejores hábitos.
2. **📅 Diarios** — lista de hábitos `daily`, cada uno con su calendario del mes
   y meta X/mes.
3. **🗓️ Semanales** — hábitos `weekly` con meta X/semana y avance.
4. **📆 Vista mensual** — grilla mensual de todos los hábitos + selector de mes
   (enero–diciembre).

Elementos globales:
- Botón flotante **+** para crear hábito (nombre, tipo, meta, color).
- Ajustes: exportar JSON, reset de mes (con confirmación), cerrar sesión.

## Definiciones finas

- **Racha (daily):** cantidad de días consecutivos hasta hoy con completado.
- **Racha (weekly):** semanas consecutivas que cumplieron la meta X/semana.
- **Progreso del mes (daily):** completados en el mes ÷ meta mensual.
- **Top 10 mejores hábitos:** ranking por % de cumplimiento de la meta en el mes
  seleccionado.
- **Reset de mes:** borra los `completions` del mes seleccionado (no los hábitos).
  Acción irreversible → confirmación explícita.
- **Export JSON:** descarga un archivo con hábitos + completados leídos de la base.

## Diseño visual

Dark mode total. Rojo como único acento (lo completado, rachas, CTAs, tab activo).

| rol                    | color      |
|------------------------|------------|
| Fondo                  | `#0a0a0a`  |
| Cards                  | `#141414`  |
| Secundario / bordes    | `#242424`  |
| Texto principal        | `#f5f5f5`  |
| Texto tenue            | `#8a8a8a`  |
| Acento / detalles      | `#e11d2a`  |

## Stack técnico

- React 18 + TypeScript + Vite
- `@supabase/supabase-js` (Auth + DB + Realtime)
- Chart.js (gráfico de progreso)
- PWA (manifest + service worker; `vite-plugin-pwa`)
- Deploy: Vercel

## Fuera de alcance (YAGNI)

- Migración del historial de días desde el Sheet.
- Compartir / multiusuario colaborativo (es una app personal).
- Notificaciones push / recordatorios (posible fase futura).
- App nativa iOS/Android (la PWA cubre el uso en celular).
