const salesTrendData = salesTrend;
new Chart(document.getElementById('dashboard-salesTrend').getContext('2d'), {
  type: 'line',
  data: {
    labels: salesTrendData.map(d => d.date),
    datasets: [{
      label: "Daily Sales (₹)",
      data: salesTrendData.map(d => d.amount),
      borderColor: '#1976d2',
      borderWidth: 4,
      fill: true,
      backgroundColor: 'rgba(25, 118, 210, 0.2)',
      tension: 0.4,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#1976d2',
      pointBorderWidth: 3,
      pointRadius: 6,
      pointHoverBackgroundColor: "#4caf50",
      pointHoverBorderColor: "#388e3c",
      pointHoverBorderWidth: 3,
      pointHoverRadius: 8,
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#1976d2', font: { weight: 700 } } },
      tooltip: { enabled: true }
    },
    scales: {
      x: {
        title: { display: true, text: 'Day', color: '#1976d2', font: { size: 16, weight: "bold" } },
        ticks: { color: '#333', font: { size: 13 } }
      },
      y: {
        title: { display: true, text: 'Amount (₹)', color: '#1976d2', font: { size: 16, weight: "bold" } },
        beginAtZero: true,
        ticks: { color: '#333', font: { size: 13 } },
        grid: { color: '#eee' }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    }
  }
});

const topSellingData = topSelling;
new Chart(document.getElementById('dashboard-topSellingItems').getContext('2d'), {
  type: 'bar',
  data: {
    labels: topSellingData.map(d => d.name),
    datasets: [{
      label: "Units Sold",
      data: topSellingData.map(d => d.soldQty),
      backgroundColor: ["#1976d2", "#e57373", "#ba68c8", "#64b5f6", "#ffd54f"],
      borderColor: '#1976d2',
      borderWidth: 2
    }]
  },
  options: {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    }
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const monthCardsContainer = document.getElementById('dashboard-monthCards');
  (monthsData || []).forEach(data => {
    const card = document.createElement('article');
    card.className = 'dashboard-month-card';
    const changeClass = data.change >= 0 ? 'dashboard-positive' : 'dashboard-negative';
    const changeSymbol = data.change >= 0 ? '▲' : '▼';
    card.innerHTML = `
      <h4>${data.month}</h4>
      <div class="dashboard-stat-number">₹${data.sales.toLocaleString()}</div>
      <div class="dashboard-stat-sub">Profit: ₹${data.profit.toLocaleString()}</div>
      <div class="dashboard-stat-sub">Top Product: ${data.topProduct}</div>
      <div class="dashboard-stat-sub ${changeClass}">${changeSymbol} ${Math.abs(data.change)}% Change</div>
    `;
    monthCardsContainer.appendChild(card);
  });
});
