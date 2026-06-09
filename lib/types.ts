// Contrato CaseAnalysis — la única fuente de verdad entre el pipeline y la UI.
// Espina: art. 167 CGP. Regla: toda norma trae cita textual; todo hecho trae soporte (folio).

export type Lado = "demandante" | "demandado";
export type RiesgoNivel = "alto" | "medio" | "bajo";

export interface Cita { pieza: string; folio: string; textual: string }
export interface Norma {
  norma: string; textual: string;
  jerarquia: "constitucion" | "ley" | "decreto" | "jurisprudencia" | "doctrina";
}

export interface Interviniente {
  id: string; nombre: string;
  rol: "demandante" | "demandado" | "apoderado" | "testigo" | "perito" | "juez" | "tercero";
  lado?: Lado;
}
export interface Relacion { de: string; a: string; tipo: string }

export interface Hecho {
  id: string; proposicion: string; alegadoPor: Lado;
  estado: "admitido" | "controvertido" | "negado" | "pendiente";
  norma?: Norma;
  carga: "demandante" | "demandado" | "dinamica" | "exento";
  cargaDinamica?: boolean;
  medioPrueba?: string; soporte?: Cita;
  gapProbatorio: boolean; riesgo: RiesgoNivel;
}

export interface Teoria {
  lado: Lado; factica: string; juridica: Norma[]; probatoria: string[];
  eslabonMasDebil: string; contraArgumento?: string; esEmergente?: boolean;
}

export interface Contradiccion {
  descripcion: string; citaA: Cita; citaB: Cita; explotacion: string; riesgo: RiesgoNivel;
}

export interface PreguntaParte {
  hechoId: string; pregunta: string; finalidad: "confesion" | "declaracion";
  confesionPresunta: boolean; soporte?: Cita; mandamiento?: string;
}
export interface PreguntaTestigo {
  testigo: string; hechoId: string; pregunta: string; sugestiva: boolean; impeachment?: string;
}
export interface Alegato {
  tema: string; hechosProbados: string[]; subsuncion: string; refutacion: string; peticion: string;
}

export interface RedTeam {
  preMortem: { causa: string; probabilidad: RiesgoNivel; impacto: RiesgoNivel; contramedida: string }[];
  debilidades: { hecho: string; debilidad: string; comoBlindar: string; comoLaExplotarian: string }[];
}
export interface PerfilContraparte {
  firma: string; estilo: string; fortalezas: string[]; comoAnticipar: string[]; fuentes?: string[];
}

// Insights que la IA "extrae" de los documentos del expediente (tabla tubular con IA).
export interface Insight {
  id: string;
  categoria: "prueba" | "procesal" | "contradiccion" | "riesgo" | "oportunidad";
  titulo: string;
  hallazgo: string;       // en lenguaje simple, claro para no-abogados
  implicacion: string;    // qué significa para la estrategia
  severidad: RiesgoNivel;
  fuente?: Cita;
}
export interface DocFicticio { nombre: string; descripcion: string }

export interface CaseAnalysis {
  titulo: string; area?: string; ladoPropio: Lado; resumen: string; riesgoGlobal: RiesgoNivel;
  problemaJuridico?: string; pretensiones?: string[]; excepciones?: string[];
  intervinientes: Interviniente[]; relaciones: Relacion[];
  hechos: Hecho[];
  teoriaAdversario: Teoria; teoriasEmergentes: Teoria[];
  contradicciones: Contradiccion[];
  interrogatorio: PreguntaParte[]; testigos: PreguntaTestigo[]; alegato: Alegato;
  redTeam: RedTeam; perfilContraparte?: PerfilContraparte;
  insights?: Insight[]; documentosFicticios?: DocFicticio[];
  meta?: { modelo: string; piiRedactado: boolean };
}
