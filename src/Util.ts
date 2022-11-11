/**
 * 
 * @param time In ms
 */
function formatTime(time: number): string {
    if (time < 0) {
        return '0 ms';
    }
    if (time < 1e3) {
        return time + ' ms';
    } 
    if (time / 1e3 < 60) {
        return (time / 1e3).toFixed(3) + ' s';
    } 
    if (time / 1e3 / 60 < 60) {
        // produces results like 6 min 45.231 s
        return Math.floor(time / 1e3 / 60) + ' min' + ' ' + (((time / 1e3 / 60) - Math.floor(time / 1e3 / 60)) * 60).toFixed(3) + ' s';
    }
    if (time / 1e3 / 60 / 60 < 24) {
        const hours = Math.floor(time / 1e3 / 60 / 60);
        const minutes = Math.floor(((time / 1e3 / 60 / 60) - hours) * 60);
        const seconds = (((((time / 1e3 / 60 / 60) - hours) * 60) - minutes) * 60).toFixed(3);
        return `${hours} ${hours > 1 ? 'hours' : 'hour'} ${minutes} min ${seconds} s`;
    }
    const days = Math.floor(time / 1e3 / 60 / 60 / 24);
    const hours = Math.floor(((time / 1e3 / 60 / 60 / 24) - days) * 24);
    const minutes = Math.floor(((((time / 1e3 / 60 / 60 / 24) - days) * 24) - hours) * 60);
    const seconds = (((((((time / 1e3 / 60 / 60 / 24) - days) * 24) - hours) * 60) - minutes) * 60).toFixed(3);
    return `${days} ${days > 1 ? 'days' : 'day'} ${hours} ${hours > 1 ? 'hours' : 'hour'} ${minutes} min ${seconds} s`;
}

export {
    formatTime,
};
