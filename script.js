document.getElementById('clickMe').addEventListener('click', function() {
    alert('Button was clicked!');
});

function median(values) {
    if (values.length === 0) return 0;
    values.sort((a, b) => a - b);
    const half = Math.floor(values.length / 2);
    if (values.length % 2) {
        return values[half];
    }
    return (values[half - 1] + values[half]) / 2.0;
}

function medianAbsoluteDeviation(values) {
    const med = median(values);
    const devs = values.map(value => Math.abs(value - med));
    return median(devs);
}

function removeOutliers(array) {
    const arrayMedian = median(array);
    const arrayMAD = medianAbsoluteDeviation(array);
    const lb = arrayMedian - 3 * arrayMAD;
    const ub = arrayMedian + 3 * arrayMAD;

    return array.filter(elem => elem >= lb && elem <= ub);
}
