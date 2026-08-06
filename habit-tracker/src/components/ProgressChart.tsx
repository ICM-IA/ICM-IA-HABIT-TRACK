import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip,
} from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

export function ProgressChart({ labels, values }: { labels: string[]; values: number[] }) {
  return (
    <Line
      data={{
        labels,
        datasets: [{ data: values, borderColor: '#e11d2a', backgroundColor: '#e11d2a',
          tension: 0.3, pointRadius: 0 }],
      }}
      options={{
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#8a8a8a' }, grid: { color: '#242424' } },
          y: { ticks: { color: '#8a8a8a' }, grid: { color: '#242424' }, beginAtZero: true },
        },
      }}
    />
  )
}
