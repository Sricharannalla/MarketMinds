import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, TrendingDown, Users, IndianRupee, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DecisionHistoryData {
  changes: Array<{
    _id: string;
    change_type: string;
    details: any;
    originalValues: any;
    timestamp: string;
    committed: boolean;
    impact: {
      salesImpact: number;
      buyersCount: number;
      avgSatisfaction: number;
      totalDecisions: number;
    };
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalChanges: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface AnalyticsData {
  summary: {
    totalChanges: number;
    totalSalesImpact: number;
    totalDecisions: number;
    avgImpactPerChange: number;
  };
  changeTypeStats: Record<string, number>;
  timelineData: Array<{
    date: string;
    changes: number;
    decisions: number;
    estimatedSales: number;
  }>;
  timeframe: number;
}

const DecisionHistory = () => {
  const { token } = useAuth();
  const [historyData, setHistoryData] = useState<DecisionHistoryData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [timeframe, setTimeframe] = useState('30');

  useEffect(() => {
    fetchData();
  }, [currentPage, filterType, timeframe]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch decision history
      const historyResponse = await fetch(
        `/api/history/decisions?page=${currentPage}&limit=10&changeType=${filterType}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!historyResponse.ok) throw new Error('Failed to fetch history data');
      const historyResult = await historyResponse.json();
      setHistoryData(historyResult);

      // Fetch analytics data
      const analyticsResponse = await fetch(
        `/api/history/analytics?timeframe=${timeframe}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!analyticsResponse.ok) throw new Error('Failed to fetch analytics data');
      const analyticsResult = await analyticsResponse.json();
      setAnalyticsData(analyticsResult);

    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load decision history');
    } finally {
      setLoading(false);
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'price_drop':
      case 'update':
        return <TrendingDown className="h-4 w-4" />;
      case 'new_product':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'price_drop':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'new_product':
        return 'bg-purple-100 text-purple-800';
      case 'remove':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><p>Loading...</p></div>;

  // Prepare chart data
  const changeTypeChartData = analyticsData ?
    Object.entries(analyticsData.changeTypeStats).map(([type, count]) => ({
      name: type.replace('_', ' ').toUpperCase(),
      value: count
    })) : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Decision History</h1>
          <div className="flex gap-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Changes</SelectItem>
                <SelectItem value="price_drop">Price Drops</SelectItem>
                <SelectItem value="update">Updates</SelectItem>
                <SelectItem value="new_product">New Products</SelectItem>
                <SelectItem value="remove">Removals</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        {analyticsData && (
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Changes</CardTitle>
                <CardDescription>In last {timeframe} days</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{analyticsData.summary.totalChanges}</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Sales Impact</CardTitle>
                <CardDescription>Estimated revenue impact</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">₹{analyticsData.summary.totalSalesImpact.toLocaleString()}</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Decisions</CardTitle>
                <CardDescription>Agent decisions processed</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{analyticsData.summary.totalDecisions}</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avg Impact/Change</CardTitle>
                <CardDescription>Average sales impact</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">₹{analyticsData.summary.avgImpactPerChange.toFixed(0)}</span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {analyticsData && analyticsData.timelineData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Impact Timeline</CardTitle>
                <CardDescription>Daily sales impact over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Sales Impact']} />
                    <Line
                      type="monotone"
                      dataKey="estimatedSales"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {changeTypeChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Change Types Distribution</CardTitle>
                <CardDescription>Breakdown by change type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={changeTypeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {changeTypeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Decision History List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Changes</CardTitle>
            <CardDescription>
              {historyData ? `Showing ${historyData.changes.length} of ${historyData.pagination.totalChanges} changes` : 'Loading...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyData ? (
              <div className="space-y-4">
                {historyData.changes.map((change) => (
                  <div key={change._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {getChangeIcon(change.change_type)}
                        <Badge className={getChangeColor(change.change_type)}>
                          {change.change_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="font-medium">
                          {change.details.brand} - {change.details.product_id}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(change.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Sales Impact</p>
                        <p className="font-medium">₹{change.impact.salesImpact.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Buyers</p>
                        <p className="font-medium">{change.impact.buyersCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
                        <p className="font-medium">{change.impact.avgSatisfaction.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Decisions</p>
                        <p className="font-medium">{change.impact.totalDecisions}</p>
                      </div>
                    </div>

                    {change.change_type === 'update' && change.originalValues && (
                      <div className="mt-3 text-sm">
                        <p className="text-muted-foreground">Changes:</p>
                        <div className="flex gap-4">
                          {change.originalValues.price !== change.details.price && (
                            <span>Price: ₹{change.originalValues.price} → ₹{change.details.price}</span>
                          )}
                          {change.originalValues.quality !== change.details.quality && (
                            <span>Quality: {change.originalValues.quality} → {change.details.quality}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Pagination */}
                <div className="flex justify-between items-center mt-6">
                  <Button
                    variant="outline"
                    disabled={!historyData.pagination.hasPrev}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {historyData.pagination.currentPage} of {historyData.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={!historyData.pagination.hasNext}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : (
              <p>No changes found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DecisionHistory;
