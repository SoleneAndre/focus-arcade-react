import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function ScoreChart({ data }: { data: Array<{ i: number; score: number }> }) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="i" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="score" stroke="#0f172a" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
