let chart;

async function simulate() {
  const amount = parseFloat(document.getElementById("amount").value);
  const asset1 = document.getElementById("asset1").value;
  const asset2 = document.getElementById("asset2").value;
  const startDate = document.getElementById("startDate").value;
  const currency = document.getElementById("currency").value;
  const mode = document.getElementById("mode").value;

  if (!startDate) return alert("Select start date");

  document.getElementById("loading").classList.remove("hidden");

  const fxRate = await getFX(currency);

  const data1 = await getHistorical(asset1);
  const filtered1 = filterFromDate(data1, startDate);
  const result1 = calculateGrowth(filtered1, amount, mode);

  let result2 = null;
  if (asset2) {
    const data2 = await getHistorical(asset2);
    const filtered2 = filterFromDate(data2, startDate);
    result2 = calculateGrowth(filtered2, amount, mode);
  }

  document.getElementById("loading").classList.add("hidden");

  showResults(result1, result2, fxRate, currency);
  drawChart(result1.series, result2?.series);
}

async function getHistorical(asset) {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${asset}/market_chart?vs_currency=usd&days=max`
  );
  const data = await res.json();
  return data.prices;
}

function filterFromDate(data, startDate) {
  const start = new Date(startDate).getTime();
  return data.filter(p => p[0] >= start);
}

function calculateGrowth(data, amount, mode) {
  const startPrice = data[0][1];
  const series = [];
  let totalValue = 0;

  if (mode === "lumpsum") {
    const units = amount / startPrice;
    data.forEach(p => {
      series.push(units * p[1]);
    });
    totalValue = series[series.length - 1];
  } else {
    let invested = 0;
    data.forEach((p, i) => {
      if (i % 30 === 0) invested += amount;
      series.push((invested / startPrice) * p[1]);
    });
    totalValue = series[series.length - 1];
  }

  return { totalValue, series };
}

async function getFX(currency) {
  if (currency === "usd") return 1;
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  const data = await res.json();
  return data.rates.PKR;
}

function showResults(r1, r2, fx, currency) {
  let html = `<h2>Final Value: ${(r1.totalValue * fx).toFixed(2)} ${currency.toUpperCase()}</h2>`;
  if (r2) {
    html += `<h3>Comparison Value: ${(r2.totalValue * fx).toFixed(2)} ${currency.toUpperCase()}</h3>`;
  }
  document.getElementById("results").innerHTML = html;
}

function drawChart(series1, series2) {
  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "line",
    data: {
      labels: series1.map((_, i) => i),
      datasets: [
        {
          label: "Asset 1",
          data: series1,
          borderColor: "#00c896",
          fill: false
        },
        series2 && {
          label: "Asset 2",
          data: series2,
          borderColor: "#ff4d4d",
          fill: false
        }
      ].filter(Boolean)
    }
  });
}
