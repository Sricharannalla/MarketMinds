import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { IndianRupee, Heart, Users, Box, TrendingUp, ShoppingCart, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DashboardData {
  totalSales: number;
  avgSatisfaction: number;
  avgLoyalty: number;
  categorySales: Array<{ category: string; sales: number }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    brand: string;
    category: string;
    price: number;
    sales: number;
    avgSatisfaction: number;
  }>;
  salesTimeline: Array<{
    timestamp: string;
    changeType: string;
    details: any;
    estimatedSalesImpact: number;
  }>;
  totalAgents: number;
  totalProducts: number;
  recentChanges: Array<{
    change_type: string;
    details: any;
    timestamp: string;
    committed: boolean;
  }>;
}

const Dashboard = () => {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard?staged=false', {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><p>Loading...</p></div>;
  if (!data) return <div className="min-h-screen bg-background"><Navbar /><p>Error loading dashboard</p></div>;

  // Prepare additional metrics
  const totalCategories = data.categorySales.length;
  const bestCategory = data.categorySales.reduce((prev, curr) => (curr.sales > prev.sales ? curr : prev), { category: '', sales: 0 });

  // Sales & Loyalty Bars
  const salesData = data.categorySales.map(item => ({ name: item.category, sales: item.sales }));
  const loyaltyData = data.categorySales.map(item => ({
    category: item.category,
    satisfaction: data.avgSatisfaction,
    loyalty: data.avgLoyalty
  }));

  // Timeline data for line chart
  const timelineData = data.salesTimeline?.slice(-10).map((item, index) => ({
    name: `Change ${index + 1}`,
    date: new Date(item.timestamp).toLocaleDateString(),
    impact: item.estimatedSalesImpact,
    type: item.changeType
  })) || [];

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Pie chart data
  const pieData = data.categorySales.map(item => ({ name: item.category, value: item.sales }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Enhanced Dashboard</h1>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Sales</CardTitle>
              <CardDescription>Revenue across all categories</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">₹{data.totalSales.toLocaleString()}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Satisfaction</CardTitle>
              <CardDescription>Customer satisfaction percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div className="bg-accent h-4 rounded-full" style={{ width: `${Math.min(data.avgSatisfaction, 100)}%` }} />
              </div>
              <span className="text-sm mt-1 block">{data.avgSatisfaction.toFixed(1)}%</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Loyalty</CardTitle>
              <CardDescription>Customer loyalty score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div className="bg-primary h-4 rounded-full" style={{ width: `${Math.min(data.avgLoyalty, 100)}%` }} />
              </div>
              <span className="text-sm mt-1 block">{data.avgLoyalty.toFixed(1)}%</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Best Category</CardTitle>
              <CardDescription>Top-performing category</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Box className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-bold">{bestCategory.category}</span>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
              <CardDescription>Revenue distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Satisfaction & Loyalty</CardTitle>
              <CardDescription>Average scores per category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={loyaltyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                  <Legend />
                  <Bar dataKey="satisfaction" fill="hsl(var(--accent))" name="Satisfaction %" />
                  <Bar dataKey="loyalty" fill="hsl(var(--primary))" name="Loyalty %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sales Distribution</CardTitle>
              <CardDescription>Category sales breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Sales']} />
                </PieChart>
              </ResponsiveContainer>
              {pieData.length === 0 && (
                <p className="text-center text-muted-foreground mt-4">No sales data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timeline Chart */}
        {timelineData.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Sales Impact Over Time</CardTitle>
              <CardDescription>Changes and their estimated impact on sales</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Impact']} />
                  <Line 
                    type="monotone" 
                    dataKey="impact" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Products and Recent Changes */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Categories by Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5">
                {data.categorySales
                  .sort((a, b) => b.sales - a.sales)
                  .slice(0, 5)
                  .map((item, idx) => (
                    <li key={idx}>{item.category}: ₹{item.sales.toLocaleString()}</li>
                  ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Best performing products (weighted by sales & satisfaction)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.topProducts && data.topProducts.length > 0 ? (
                  data.topProducts.slice(0, 5).map((product, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium">{product.brand} - {product.productId}</p>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                        <p className="text-xs text-muted-foreground">Satisfaction: {product.avgSatisfaction}%</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{product.sales.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">₹{product.price}/unit</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No products with sales data</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Products need to have purchase records to appear here
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Market Changes</CardTitle>
              <CardDescription>Latest committed changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recentChanges?.slice(0, 5).map((change, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium capitalize">{change.change_type.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        {change.details.product_id} - {change.details.brand}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(change.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )) || <p className="text-muted-foreground">No recent changes</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
