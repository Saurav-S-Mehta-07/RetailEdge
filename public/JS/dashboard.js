window.addEventListener('load', () => {
  // SALES TREND CHART
  const ctx1 = document.getElementById('salesTrendChart').getContext('2d');
  new Chart(ctx1, {
    type: 'line',
    data: {
      labels: ['May 28', 'May 29', 'May 30', 'Jun 1', 'Jun 2', 'Jun 3'],
      datasets: [{
        label: 'Daily Sales (₹)',
        data: [0, 0, 0, 20000, 45000, 164120],
        borderColor: '#d32f2f',
        backgroundColor: 'rgba(211,47,47,0.2)',
        fill: true,
        tension: 0.3,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // TOP 5 SELLING ITEMS CHART
  const ctx2 = document.getElementById('topItemsChart').getContext('2d');
  new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: ['Techno Camon 30', 'Vivo V15', 'iPhone 12 Cover', 'iPhone 13', 'Redmi Note 10'],
      datasets: [{
        label: 'Total Sold',
        data: [5, 2, 1, 1, 1],
        backgroundColor: [
          '#d32f2f',
          '#e57373',
          '#f44336',
          '#ffcdd2',
          '#ffebee'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
});
