export function dayOfWeekAsInteger(day: number) {
    return ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][day] || null;
}