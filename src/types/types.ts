// One weekly meeting time. day: 0=Lu .. 5=Sa. start/end in minutes from midnight.
export interface TimeBlock {
    day: number;
    start: number;
    end: number;
}

// A concrete section of a subject with all its weekly blocks.
// blocks can be empty: async/online classes with no fixed schedule.
export interface Section {
    sigla: string;
    nombre: string;
    seccion: string;
    nivel: string | number;
    isVirtual: boolean;
    docente: string;
    blocks: TimeBlock[];
}

export interface ElectiveOption {
    sigla: string;
    nombre: string;
    sections: Section[];
}

export interface Asignatura {
    IsVirtual: string | null;
    Carrera: string;
    Docente: string;
    Horario: string;
    Jornada: string;
    Nivel: string | number;
    NombreAsignatura: string;
    Plan: number;
    Seccion: string;
    Sede: string;
    SiglaAsignatura: string;
}
