import { formatTime } from '../Util';

test('Time Formatting ms', () => {
    expect(formatTime(645)).toBe('645 ms');
});

test('Time Formatting s', () => {
    expect(formatTime(47e3)).toBe('47.000 s');
})

test('Time Formatting s with ms', () => {
    expect(formatTime(47e3+372)).toBe('47.372 s');
});

test('Time Formatting min', () => {
    expect(formatTime(23*60e3+34e3+999)).toBe('23 min 34.999 s');
});

test('Time Formatting hour', () => {
    expect(formatTime(1*60*60e3+0*60e3+59e3+0)).toBe('1 hour 0 min 59.000 s');
});

test('Time Formatting hours', () => {
    expect(formatTime(12*60*60e3+0*60e3+59e3+0)).toBe('12 hours 0 min 59.000 s');
});

test('Time Formatting day', () => {
    expect(formatTime(1*24*60*60e3+12*60*60e3+12*60e3+34e3+834)).toBe('1 day 12 hours 12 min 34.834 s');
});

test('Time Formatting days', () => {
    expect(formatTime(7*24*60*60e3+12*60*60e3+12*60e3+34e3+834)).toBe('7 days 12 hours 12 min 34.834 s');
});
