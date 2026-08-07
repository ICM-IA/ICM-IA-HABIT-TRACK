# FOCUS Habit Tracker — Objetivos + Panel + Marcado — Diseño

**Fecha:** 2026-08-06
**Objetivo:** Replicar la lógica de la planilla "FOCUS HABIT TRACKER" en la web app: planificar objetivos por mes, marcar el día a día, y ver el progreso calculado — todo atado a una fecha de inicio y una ventana de 12 meses.

---

## 1. Visión general

La app pasa de "marcar hábitos" a un sistema con **4 vistas conectadas**:

| Vista | Qué hace | Escribe / Lee |
|-------|----------|----------------|
| **Objetivos** (Dashboard) | Planificás cuánto querés hacer de cada hábito en cada mes | Escribe metas por hábito/mes |
| **Panel** | Muestra el progreso global y mensual contra los objetivos | Solo lee (todo calculado) |
| **Mensual** | Marcás el día a día (diarios) y por semana (semanales) | Escribe completions |
| **Config** | Fecha de inicio (año + mes) que define la ventana de 12 meses | Escribe settings |

**Ventana de 12 meses:** la fecha de inicio (ej. Agosto 2026) define el "año de seguimiento" = 12 meses (Agosto 2026 → Julio 2027). Todas las vistas trabajan sobre esa ventana.

---

## 2. Modelo de datos (cambios en Supabase)

### 2.1 Tabla nueva: `settings` (1 fila por usuario)
```sql
create table settings (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  start_year  int not null,
  start_month int not null check (start_month between 1 and 12),
  updated_at  timestamptz default now()
);
```
Define la fecha de inicio. Si no existe fila → se usa el mes actual como default.

### 2.2 Tabla nueva: `habit_goals` (meta por hábito y mes)
```sql
create table habit_goals (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  year     int not null,
  month    int not null check (month between 1 and 12),
  target   int not null default 0,
  unique (habit_id, year, month)
);
```
Cada celda de la grilla de Objetivos = una fila. Si no hay fila para un hábito/mes → meta = 0 (o el `goal` default del hábito, ver decisiones).

### 2.3 Sin cambios de esquema para completions
- **Hábitos diarios:** se marcan por día → una fila `completions` con `date = YYYY-MM-DD` (como hoy).
- **Hábitos semanales:** se marcan por semana → una fila `completions` con `date` = **primer día del bloque de semana** (ver §4). Una tilde = esa semana cumplida.

Ambas tablas nuevas llevan RLS igual que las existentes: `using (auth.uid() = user_id) with check (auth.uid() = user_id)`, y se agregan a la publicación de Realtime.

---

## 3. Definición de "semana" (bloques fijos del mes)

La planilla agrupa los días en **Semana 1–5 por bloques fijos de 7**, no por semanas ISO:

| Semana | Días | Color |
|--------|------|-------|
| 1 | 1–7 | rojo |
| 2 | 8–14 | violeta |
| 3 | 15–21 | azul |
| 4 | 22–28 | amarillo |
| 5 | 29–fin | verde |

Esta definición se usa para: el agrupado de la grilla mensual, el "Resumen semanal", y el marcado de hábitos semanales (5 slots por mes).

> **Nota:** esto reemplaza el uso de semanas ISO (`weekKey`) para el marcado semanal. `weekKey` puede seguir existiendo para la racha semanal si hace falta, pero la UI de marcado usa bloques del mes.

---

## 4. Vistas en detalle

### 4.1 Objetivos (Dashboard)

- **Cabecera:** "2026 - 2027", "FOCUS HABIT TRACKER", **fecha de inicio** (Año + Mes, editable), **METAS A ALCANZAR** = suma de todas las metas del año.
- **Gráfico de barras:** total de objetivos por mes (los 12 meses de la ventana).
- **Tabla de objetivos:** filas = hábitos, columnas = 12 meses (editables), columna **TOTAL** = suma anual por hábito. Fila TOTAL abajo por mes.
- **Alerta:** "¡ATENCIÓN! Al menos un hábito tiene más objetivos que días en el mes" cuando `target > díasDelMes` (para diarios).
- Cada celda editable escribe/actualiza `habit_goals`.

### 4.2 Panel (solo lectura, calculado)

- **Donut:** % global = `terminado_total / objetivo_total`.
- **Progreso mensual (línea):** % de cumplimiento por mes, techo 100%.
- **Tabla resumen mensual:** filas **Terminado / Objetivo / Restante** × 12 meses + **Progreso Global**.
- **Tiles:** Hábitos diarios totales, Objetivos de hábitos diarios (suma), Terminado (suma).
- **10 metas más alcanzadas:** comparación Terminado vs Meta de los 10 hábitos con mejor %.
- **Tabla por hábito × mes:** columna META (total anual), % de cumplimiento por mes, header hecho/objetivo (ej. 0/298), columna Progreso Global %.

**Cálculos:**
- `terminado(habito, mes)` = cantidad de completions de ese hábito en ese mes.
- `objetivo(habito, mes)` = `habit_goals.target`.
- `progreso(habito, mes)` = `terminado / objetivo` (0 si objetivo 0).
- Totales por mes = suma sobre hábitos.

### 4.3 Mensual (marcado)

**Cabecera:** "- Enero -", tiles **Hábitos completados / Hábitos restantes / Número de días**, **gráfico de progreso diario** (punto por día), **donut Progreso diario general %**.

**Grilla hábitos diarios:**
- Casilla por día, agrupadas por Semana 1–5 con color por semana.
- Columnas extra por hábito: **META** (del mes), **TERMINADO**, **RESTANTE**, **PROGRESO %**, **RACHA ACTUAL**, **RACHA MÁS LARGA**.

**Resumen semanal:** por día (Terminado), Progreso global (hechas/total, %), Progreso semanal por semana.

**Top 10:** mejores hábitos diarios del mes por %.

**Sección hábitos semanales:**
- Una casilla por semana (5 slots).
- Tiles **Objetivos / Terminado / Queda por hacer**.
- Por semana: Terminado / Meta / Progreso %. **Progreso semanal general**. Bloque **NOTAS** (texto libre — ver decisiones).

### 4.4 Config
- Editar fecha de inicio (Año + Mes). Al cambiarla, se recalcula la ventana de 12 meses en todas las vistas.

---

## 5. Lógica nueva (funciones puras, testeables)

- `trackingMonths(startYear, startMonth) → [{year, month}] × 12`
- `monthWeeks(year, month) → [{semana, dias[], color}]` (bloques de 7)
- `longestStreak(done: Set<string>) → number` (racha más larga histórica)
- `currentStreak` (ya existe: `computeDailyStreak`)
- `weeklyDone(done, year, month) → boolean[5]` (qué semanas del mes están cumplidas)
- Reutilizar `monthCompletionCount`, `monthProgress`.

Todas con tests unitarios (patrón actual: Vitest).

---

## 6. Paleta / estilo

Se mantiene **negro/rojo** actual. El "color por semana" (rojo/violeta/azul/amarillo/verde) se usa **solo como acento sutil** en bordes/encabezados de semana, no como fondo saturado, para no romper la identidad negro/rojo. (A confirmar: ¿querés los 5 colores fuertes como la planilla, o versión sobria?)

---

## 7. Fases de construcción (para no romper lo que ya funciona)

1. **Datos + Config:** tablas `settings` y `habit_goals`, hooks, editor de fecha de inicio.
2. **Objetivos:** grilla editable + total anual + barras + alerta.
3. **Panel:** todas las tablas/donut/gráficos calculados.
4. **Mensual:** upgrade de marcado (semanas con color, columnas racha, sección semanal, notas, resumen semanal, top 10).
5. **Pulido:** gráficos, responsive, tests.

Cada fase deja la app funcionando y desplegable.

---

## 8. Decisiones tomadas / supuestos (REVISAR)

1. **Meta faltante:** si un hábito/mes no tiene fila en `habit_goals`, la meta es **0** (no cuenta). ¿O querés que herede una meta default?
2. **Hábitos semanales:** se marcan **binario por semana** (5 slots/mes); la meta semanal = cantidad de semanas objetivo del mes. ¿Está bien binario, o necesitás contar veces por semana?
3. **NOTAS:** texto libre por mes (una tabla o campo `notes` por user/mes). ¿Lo querés, o lo dejamos para después?
4. **Colores de semana:** acento sutil vs 5 colores fuertes (§6).
5. **Racha:** actual + más larga por hábito diario. Semanales sin racha (o agregarla).

## 9. Preguntas abiertas
- ¿La ventana es siempre 12 meses, o querés poder ver años anteriores/siguientes?
- ¿Los objetivos se cargan a mano celda por celda, o querés un "rellenar todos los meses con este valor" para cargar rápido?

---

## 10. Testing
- Funciones de §5 con Vitest (mantener los 17 tests actuales verdes + nuevos).
- Build limpio (`npm run build`) y deploy a Vercel por fase.
