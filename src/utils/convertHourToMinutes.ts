export function convertHourToMinutes(time: String) {
    const [hour, minutes] = time.split(':').map(Number)
    const timeInMinutes = (hour * 60) + minutes;

    return timeInMinutes;
}

export function convertMinutesToHours(minutes: number) {
    let h = Math.floor(minutes / 60);
    let m = minutes % 60;
    const hour = h < 10 ? '0' + h : h;
    const minute = m < 10 ? '0' + m : m;
    return `${hour}:${minute}`;
}