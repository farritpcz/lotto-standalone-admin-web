/**
 * Admin Dashboard — หน้าหลักแอดมิน
 *
 * แสดง: สรุปยอดรวม, กำไร/ขาดทุน, จำนวนสมาชิก, จำนวน bets
 *
 * ความสัมพันธ์:
 * - เรียก API: dashboardApi.getStats() → standalone-admin-api (#5)
 * - provider-backoffice-admin-web (#10) มีหน้า dashboard คล้ายกัน
 *   ต่างกันที่: #10 มีข้อมูลแยกตาม operator
 */

'use client'

export default function AdminDashboard() {
  // TODO: fetch จาก dashboardApi.getStats()
  const stats = {
    totalMembers: 0,
    activeMembers: 0,
    totalBetsToday: 0,
    totalAmountToday: 0,
    profitToday: 0,
    openRounds: 0,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="สมาชิกทั้งหมด" value={stats.totalMembers} color="blue" />
        <StatCard label="สมาชิก Active" value={stats.activeMembers} color="green" />
        <StatCard label="Bets วันนี้" value={stats.totalBetsToday} color="purple" />
        <StatCard label="ยอดแทงวันนี้" value={`฿${stats.totalAmountToday.toLocaleString()}`} color="yellow" />
        <StatCard label="กำไรวันนี้" value={`฿${stats.profitToday.toLocaleString()}`} color="green" />
        <StatCard label="รอบที่เปิด" value={stats.openRounds} color="cyan" />
      </div>

      {/* Chart placeholder */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-4">กราฟยอดแทง 7 วันย้อนหลัง</h2>
        <div className="h-64 flex items-center justify-center text-gray-500">
          TODO: recharts BarChart
        </div>
      </div>

      {/* Recent bets */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">การแทงล่าสุด</h2>
        <div className="text-gray-500 text-sm">TODO: ตาราง bets ล่าสุด</div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
  }

  return (
    <div className={`bg-gradient-to-br ${colorMap[color] || colorMap.blue} border rounded-xl p-4`}>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className={`text-xl font-bold mt-1 ${colorMap[color]?.split(' ').pop()}`}>{value}</p>
    </div>
  )
}
