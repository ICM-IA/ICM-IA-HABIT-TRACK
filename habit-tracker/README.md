# ICM-IA — HABIT TRACK

App de seguimiento de hábitos, mobile-first, con sincronización entre dispositivos.
React + TypeScript + Vite · Supabase (Postgres + Auth Google + Realtime) · Chart.js · PWA instalable.

- **Diarios**: meta de X días por mes. **Semanales**: meta de X días por semana.
- Dashboard con "Hoy", stats, gráfico de progreso y Top 10.
- Calendario por hábito, vista mensual, rachas 🔥.
- Exportar JSON, reset de mes, login con Google.
- Tema oscuro (negro / blanco / rojo). Datos privados por usuario (Row Level Security).

---

## Desarrollo local

```bash
cd habit-tracker
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run test     # tests (vitest)
```

Necesitás un archivo `.env.local` (copiá `.env.example`) con las claves de tu proyecto Supabase:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-public-key
```

> La `anon key` es pública por diseño: no da acceso a datos ajenos porque las políticas RLS
> restringen cada fila a su dueño. Nunca pongas la `service_role key` en el frontend.

---

## Puesta en marcha (una sola vez)

### 1. Crear el proyecto Supabase
1. Entrá a https://supabase.com y creá un proyecto gratuito.
2. En **Project Settings → API** copiá el **Project URL** y la **anon public key** a tu `.env.local`.

### 2. Crear las tablas
En Supabase → **SQL Editor** → pegá el contenido de [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
Verificá en **Table Editor** que existen `habits` y `completions` con RLS activado.

### 3. Habilitar Realtime en las tablas (¡importante!)
La sincronización entre dispositivos y el refresco instantáneo dependen de esto.
En Supabase → **Database → Replication** (o **Table Editor → cada tabla → Realtime**),
agregá `habits` y `completions` a la publicación `supabase_realtime`.

> La app también recarga tras cada acción, así que funciona aunque Realtime esté apagado;
> pero sin Realtime los cambios hechos en otro dispositivo no aparecen hasta recargar.

### 4. Login con Google
1. En **Google Cloud Console** creá credenciales OAuth 2.0 (tipo "Web application").
   Como *Authorized redirect URI* poné la que te muestra Supabase en el paso siguiente
   (formato `https://TU-PROYECTO.supabase.co/auth/v1/callback`).
2. En Supabase → **Authentication → Providers → Google**: activá Google y pegá el
   **Client ID** y **Client Secret** de Google.
3. En Supabase → **Authentication → URL Configuration**: agregá tus URLs permitidas
   (`http://localhost:5173` para desarrollo y, más tarde, la URL de Vercel).

---

## Deploy en Vercel

1. Subí el repo a GitHub:
   ```bash
   git remote add origin https://github.com/TU-USUARIO/icm-habit-track.git
   git push -u origin feat/icm-habit-track   # o main, según tu flujo
   ```
2. En https://vercel.com → **New Project** → importá el repo.
   - **Framework preset**: Vite.
   - **Root Directory**: `habit-tracker`.
   - **Environment Variables**: agregá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
     (los mismos de tu `.env.local`).
3. Deploy. Copiá la URL de producción y agregala en Supabase →
   **Authentication → URL Configuration** (redirect URLs permitidas).
4. Abrí la URL en el celular → **Entrar con Google** → creá un hábito y marcá el día.
   Abrila también en la compu para ver la sincronización.

### Instalar como app en el celular (PWA)
En el navegador del celular, menú → **Agregar a la pantalla de inicio**.
Queda con ícono propio y se abre a pantalla completa.

---

## Estructura del proyecto

```
habit-tracker/
├── supabase/schema.sql     # tablas + RLS (ejecutar en Supabase)
└── src/
    ├── lib/                # cliente supabase + tipos
    ├── logic/              # lógica pura testeada (fechas, rachas, stats)
    ├── data/               # hooks: auth, habits, completions (+ realtime)
    ├── components/         # TabBar, calendario, modal, gráfico, ajustes…
    └── screens/            # Dashboard, Diarios, Semanales, Mensual
```
