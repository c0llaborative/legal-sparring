# LÉEME — Legal Sparring (explicación en simple)

## ¿Qué es?

Legal Sparring es un **entrenador de litigios con IA**. Le das los documentos de un caso (demanda, contestación, excepciones, pruebas…) y la herramienta:

1. **Reconstruye la teoría del caso de la contraparte** — qué va a argumentar el otro lado y por dónde te va a atacar.
2. **Te arma el "Kit de Audiencia"** — las preguntas de interrogatorio, las preguntas a testigos y la línea del alegato de conclusión.
3. **Te deja practicar por voz** contra una IA que juega a la contraparte y al juez.

Todo está **anclado a folio** (cada dato dice de qué documento sale) y en lenguaje del **Código General del Proceso**. No inventa: si algo no está en el expediente, no lo afirma.

## ¿Para qué sirve?

Para que un litigante llegue a la audiencia **preparado para lo que hará el adversario**, en minutos en vez de horas. No reemplaza al abogado: **escala su criterio**. El diferenciador es que reconstruye al adversario sobre TU expediente real y en derecho colombiano — algo que las herramientas tipo CoCounsel o Harvey no hacen.

## ¿Cómo está armado? (arquitectura en simple)

```
   Documentos del caso
        │
        ▼
   Se anonimizan los datos personales (no salen en crudo)
        │
        ▼
   La IA (vía OpenRouter) los lee y devuelve UN objeto estructurado: "CaseAnalysis"
        │
        ▼
   La interfaz dibuja ese objeto en módulos (Diagnóstico, Kit, etc.)
```

El **objeto `CaseAnalysis`** (definido en `lib/types.ts`) es el corazón de todo: define qué produce la IA y qué dibuja la pantalla. **Si cambias eso, cambia todo.**

### Los módulos (menú izquierdo)
- **Resumen:** lo esencial del caso de un vistazo (la teoría probable del otro lado + riesgo).
- **Diagnóstico:** el problema jurídico, qué pide cada lado, el grafo de las partes y la "matriz de prueba" (qué hechos están en disputa y quién debe probar cada uno).
- **Insights:** los hallazgos que la IA sacó de los documentos, explicados en simple.
- **Kit de Audiencia:** las 4 salidas (teoría del adversario, interrogatorio, testigos, alegato) + un puntaje de qué tan listo estás.
- **Sparring:** practicar por voz o texto contra la IA.
- **Sala Roja:** tus debilidades (un "pre-mortem" que asume que ya perdiste) + puntaje + historial de progreso.
- **Guía:** la explicación dentro de la app.

## Cómo correrlo (en tu computador)

1. Instala Node.js (18+).
2. En la carpeta del proyecto:
   ```
   npm install
   npm run dev
   ```
3. Abre `http://localhost:3000` en **Chrome** (la voz funciona en Chrome).
4. Para verlo funcionando sin configurar nada: elige un **caso de muestra**.
5. Para análisis en vivo y voz: copia `.env.example` a `.env.local` y pon las llaves (ver ese archivo).

## Cómo contribuir (para el editor)

- **Trabaja en una rama** y abre un **Pull Request** (así el owner revisa antes de mezclar a `main`).
- **No subas `.env.local`** — tiene las llaves de API y está ignorado a propósito.
- Los **casos de muestra** están en `lib/sample.ts`.
- El **diseño/estilos** están en `app/globals.css`.
- Detalle técnico y reglas en [`CLAUDE.md`](CLAUDE.md).

## Permisos del repo

- **Owner (Juan):** administra el repo, permisos y settings.
- **Editor (colaborador con rol *Write*):** puede editar, crear ramas y hacer push / Pull Requests — pero no borrar el repo ni cambiar permisos.
