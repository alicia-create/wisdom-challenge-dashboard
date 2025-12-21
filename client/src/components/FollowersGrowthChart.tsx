import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Facebook, Instagram, Youtube, TrendingUp } from "lucide-react";

interface FollowersRecord {
  date: string;
  facebookFollowers: number;
  instagramFollowers: number;
  youtubeFollowers: number;
}

interface FollowersGrowthChartProps {
  data: FollowersRecord[];
}

/**
 * Social Media Followers Growth Chart
 * Line chart showing temporal evolution of Facebook, Instagram, and YouTube followers
 */
export function FollowersGrowthChart({ data }: FollowersGrowthChartProps) {
  // Sort data by date (oldest first for chronological display)
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));

  // Format date for display (e.g., "Dec 13")
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00'); // Avoid timezone conversion
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format number with commas
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-semibold">{formatNumber(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Empty state
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle>Social Media Followers Growth</CardTitle>
          </div>
          <CardDescription>
            Track follower growth across Facebook, Instagram, and YouTube over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex gap-3 mb-4 opacity-50">
              <Facebook className="w-8 h-8 text-blue-600" />
              <Instagram className="w-8 h-8 text-pink-600" />
              <Youtube className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-muted-foreground mb-2">No followers data available yet</p>
            <p className="text-sm text-muted-foreground">
              Go to <span className="font-semibold">Data Hub → Social Followers</span> to add your first record
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate growth stats
  const latestRecord = sortedData[sortedData.length - 1];
  const oldestRecord = sortedData[0];
  
  const facebookGrowth = latestRecord.facebookFollowers - oldestRecord.facebookFollowers;
  const instagramGrowth = latestRecord.instagramFollowers - oldestRecord.instagramFollowers;
  const youtubeGrowth = latestRecord.youtubeFollowers - oldestRecord.youtubeFollowers;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <CardTitle>Social Media Followers Growth</CardTitle>
        </div>
        <CardDescription>
          Follower evolution from {formatDate(oldestRecord.date)} to {formatDate(latestRecord.date)} ({sortedData.length} data points)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Growth Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <Facebook className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-sm text-muted-foreground">Facebook</div>
              <div className="text-lg font-bold">{formatNumber(latestRecord.facebookFollowers)}</div>
              <div className={`text-xs ${facebookGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {facebookGrowth >= 0 ? '+' : ''}{formatNumber(facebookGrowth)} total
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg">
            <Instagram className="w-8 h-8 text-pink-600" />
            <div>
              <div className="text-sm text-muted-foreground">Instagram</div>
              <div className="text-lg font-bold">{formatNumber(latestRecord.instagramFollowers)}</div>
              <div className={`text-xs ${instagramGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {instagramGrowth >= 0 ? '+' : ''}{formatNumber(instagramGrowth)} total
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <Youtube className="w-8 h-8 text-red-600" />
            <div>
              <div className="text-sm text-muted-foreground">YouTube</div>
              <div className="text-lg font-bold">{formatNumber(latestRecord.youtubeFollowers)}</div>
              <div className={`text-xs ${youtubeGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {youtubeGrowth >= 0 ? '+' : ''}{formatNumber(youtubeGrowth)} total
              </div>
            </div>
          </div>
        </div>

        {/* Line Chart */}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={sortedData.map(record => ({
              date: formatDate(record.date),
              Facebook: record.facebookFollowers,
              Instagram: record.instagramFollowers,
              YouTube: record.youtubeFollowers,
            }))}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={formatNumber}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="Facebook"
              stroke="#1877F2"
              strokeWidth={2}
              dot={{ fill: '#1877F2', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Instagram"
              stroke="#E4405F"
              strokeWidth={2}
              dot={{ fill: '#E4405F', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="YouTube"
              stroke="#FF0000"
              strokeWidth={2}
              dot={{ fill: '#FF0000', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
