import { useMemo, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts'
import { PieChart as PieIcon, BarChart3 } from 'lucide-react'

const CATEGORY_COLORS = {
  plastic: '#25637e',
  metal: '#556070',
  paper: '#a27622',
  glass: '#1b694b',
  organic: '#446e22',
  'non-recyclable': '#b13524',
  'e-waste': '#792a9c',
  'expired-drugs': '#a31843',
  other: '#606b76',
}

function normalizeCategory(cat) {
  if (!cat) return 'other'
  return String(cat).trim().toLowerCase().replace(/[\s_]+/g, '-')
}

function getCategoryColor(slug) {
  return CATEGORY_COLORS[slug] || CATEGORY_COLORS.other
}

export function WasteDistributionChart({ rows }) {
  const [chartType, setChartType] = useState('pie') // 'pie' | 'bar'
  const [activeCategory, setActiveCategory] = useState(null)

  const distribution = useMemo(() => {
    if (!rows || rows.length === 0) return []

    // Map each row's volume
    const totals = {}
    let totalAssigned = 0

    rows.forEach((row) => {
      const rawCat = row.Category || 'other'
      const slug = normalizeCategory(rawCat)
      const label = String(rawCat).trim()

      const rawPct = String(row.Visual_Volume_Percentage || '').replace('%', '').trim()
      const parsedPct = parseFloat(rawPct)
      const volume = !isNaN(parsedPct) && parsedPct > 0 ? parsedPct : 0

      if (!totals[slug]) {
        totals[slug] = {
          categoryKey: slug,
          name: label.charAt(0).toUpperCase() + label.slice(1),
          value: 0,
          itemCount: 0,
          color: getCategoryColor(slug),
        }
      }

      totals[slug].value += volume
      totals[slug].itemCount += 1
      totalAssigned += volume
    })

    // If no percentages were provided or total is 0, assign equal weight by count
    if (totalAssigned === 0) {
      const equalWeight = 100 / rows.length
      Object.values(totals).forEach((group) => {
        group.value = Math.round(group.itemCount * equalWeight * 10) / 10
      })
    } else {
      // Round to 1 decimal
      Object.values(totals).forEach((group) => {
        group.value = Math.round(group.value * 10) / 10
      })
    }

    return Object.values(totals).sort((a, b) => b.value - a.value)
  }, [rows])

  if (distribution.length === 0) return null

  const topCategory = distribution[0]

  return (
    <div id="waste-distribution-component" className="summary-chart-container">
      <div className="chart-header">
        <div className="chart-title-wrap">
          <span className="chart-eyebrow">DISTRIBUTION BY VOLUME</span>
          <h3 className="chart-title">Material Composition</h3>
        </div>
        <div className="chart-type-toggle" role="group" aria-label="Chart type toggle">
          <button
            id="chart-toggle-pie"
            type="button"
            className={`toggle-btn ${chartType === 'pie' ? 'active' : ''}`}
            onClick={() => setChartType('pie')}
            title="Show Donut Chart"
          >
            <PieIcon size={14} />
            <span>Donut</span>
          </button>
          <button
            id="chart-toggle-bar"
            type="button"
            className={`toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
            title="Show Horizontal Bar Chart"
          >
            <BarChart3 size={14} />
            <span>Bar</span>
          </button>
        </div>
      </div>

      <div className="chart-body-layout">
        <div className="chart-canvas-box">
          <ResponsiveContainer width="100%" height={230}>
            {chartType === 'pie' ? (
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={distribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={84}
                  paddingAngle={3}
                  cornerRadius={4}
                  onMouseEnter={(entry) => setActiveCategory(entry.categoryKey)}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  {distribution.map((entry) => (
                    <Cell
                      key={`cell-${entry.categoryKey}`}
                      fill={entry.color}
                      opacity={
                        activeCategory && activeCategory !== entry.categoryKey ? 0.45 : 1
                      }
                      stroke="#f4efe4"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
              </PieChart>
            ) : (
              <BarChart
                data={distribution}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fill: '#657267', fontSize: 11, fontFamily: 'DM Mono' }}
                  axisLine={{ stroke: '#cbd0c3' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#36443a', fontSize: 11, fontFamily: 'DM Mono' }}
                  axisLine={{ stroke: '#cbd0c3' }}
                  tickLine={false}
                  width={85}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  onMouseEnter={(entry) => setActiveCategory(entry.categoryKey)}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  {distribution.map((entry) => (
                    <Cell
                      key={`bar-${entry.categoryKey}`}
                      fill={entry.color}
                      opacity={
                        activeCategory && activeCategory !== entry.categoryKey ? 0.45 : 1
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>

          {chartType === 'pie' && topCategory && (
            <div className="donut-center-stat" aria-hidden="true">
              <span className="center-pct">{topCategory.value}%</span>
              <span className="center-label">{topCategory.name}</span>
            </div>
          )}
        </div>

        <div className="chart-legend-grid">
          {distribution.map((item) => {
            const isHovered = activeCategory === item.categoryKey
            return (
              <div
                key={item.categoryKey}
                className={`legend-card ${isHovered ? 'hovered' : ''}`}
                onMouseEnter={() => setActiveCategory(item.categoryKey)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <div className="legend-main">
                  <span
                    className="legend-color-dot"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="legend-cat-name">{item.name}</span>
                </div>
                <div className="legend-metric">
                  <span className="legend-pct">{item.value}%</span>
                  <span className="legend-sub">
                    {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const data = payload[0].payload
  return (
    <div className="chart-custom-tooltip">
      <div className="tooltip-head">
        <span
          className="tooltip-dot"
          style={{ backgroundColor: data.color }}
        />
        <strong className="tooltip-title">{data.name}</strong>
      </div>
      <div className="tooltip-value">
        <span>Volume share:</span>
        <strong>{data.value}%</strong>
      </div>
      <div className="tooltip-items">
        <span>Items count:</span>
        <span>{data.itemCount}</span>
      </div>
    </div>
  )
}

export default WasteDistributionChart
