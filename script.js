import {
  ThirdwebProvider,
  ConnectWallet,
  coinbaseWallet,
  walletConnect,
  localWallet,
  paperWallet,
} from "@thirdweb-dev/react";
export default function App() {
  return (
    <ThirdwebProvider
      activeChain="polygon"
      clientId="YOUR_CLIENT_ID"
      supportedWallets={[
        coinbaseWallet(),
        walletConnect(),
        localWallet(),
        paperWallet({
          paperClientId: "YOUR_PAPER_CLIENT_ID",
        }),
      ]}
    >
      <ConnectWallet theme={"dark"} />
    </ThirdwebProvider>
  );
}

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

// This will compute the log prices and add them to each data entry.
function preprocessData(data) {
    return data.map(entry => ({
        ...entry,
        logPrice: Math.log(entry.price)
    }));
}
/**
 * For each data entry, this function creates an array of past log prices for a given lookback period, exclusive of the
 * log price for the entry. The function assumes that the data belong to the same group (e.g. same NFT collection).
 *
 * @param {Array} data - A list of data entries, where each entry has properties like blockNumber and logPrice.
 * @param {number} lookback - The lookback period.
 * @returns {Array} - The input data enriched with two additional properties: tradeId and logPricesLookback.
 */Adjusted!
function createLookback(data, lookback) {
    let result = [];
    for (let idx = 0; idx < data.length; idx++) {
        const row = data[idx];
        let logPrices;
        if (idx === 0) {
            logPrices = [-42.0]; // or any default value for the first data point
        } else {
            const idxStart = Math.max(0, idx - lookback);
            logPrices = data.slice(idxStart, idx).map(entry => entry.logPrice);
        }
        result.push({
            ...row,
            logPricesLookback: logPrices,
            tradeId: idx
        });
    }
    return result;
}

/**
 * Function: computeNewQuantile
 * Purpose: Adjust the current effective quantile based on the target and observed quantiles.
 * Explanation:
 * - Given the current quantile, target quantile, and the observed quantile, we compute the difference 
 *   between the target and observed quantiles.
 * - This difference is multiplied by a `speed` parameter, which then gets added to the current quantile.
 * - The resulting value is constrained within `pctTargetMin` and `pctTargetMax`. This ensures that our adjusted quantile
 *   doesn't go beyond these bounds.
 */
function computeNewQuantile(qCurr, qTarget, qObs, speed, pctTargetMin, pctTargetMax) {
    return Math.min(pctTargetMax, Math.max(pctTargetMin, qCurr + speed * (qTarget - qObs)));
}

/**
 * Function: computeQuantile
 * Purpose: Find the value corresponding to a given quantile in an array of numbers.
 * Explanation:
 * - First, remove any 'not-a-number' (NaN) values from the array. 
 * - Then sort the array.
 * - Calculate the position in the sorted array for the desired quantile. For instance, if the quantile is 0.25 and 
 *   there are 100 numbers, we'd look for the value at the 25th position.
 * - Return the value found at that position.
 */
function computeQuantile(array, quantile) {
    const cleanArray = array.filter(value => !isNaN(value));
    const sortedArray = cleanArray.sort((a, b) => a - b);
    const pos = Math.floor(quantile * sortedArray.length);
    return sortedArray[pos];
}

/**
 * Function: computeQuantileObs
 * Purpose: This function calculates an "observed quantile" for each row based on its log price in relation to the past log prices.
 * Explanation:
 * - The data is first sorted by `trade_id`.
 * - If a row's `log_price` is less than or equal to the target quantile for its lookback period, it gets a value of 1, otherwise 0. 
 *   This indicates if the price is below the target.
 * - For each row, we then calculate the average of these values over a specified `backtest` window. 
 *   This average is our observed quantile.
 */
function computeQuantileObs(data, backtest) {
    const sortedData = data.sort((a, b) => a.trade_id - b.trade_id);
    sortedData.forEach((row, idx) => {
        const previousValues = sortedData.slice(Math.max(0, idx - backtest), idx).map(r => r.price_smaller);
        const meanValue = previousValues.reduce((acc, val) => acc + val, 0) / previousValues.length;
        row.quantile_obs = meanValue;
    });
    return sortedData;
}

fetch('data.json')
   .then(response => response.json())
   .then(data => {
       const processedData = preprocessData(data);
       const result = createLookback(processedData, 2);
       console.log(result);
   })
   .catch(error => console.error('Error fetching data:', error))
