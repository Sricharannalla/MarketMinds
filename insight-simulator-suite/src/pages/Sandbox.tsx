// import { useEffect, useState } from 'react';
// import { useNavigate,useSearchParams } from 'react-router-dom';
// import { Navbar } from '@/components/Navbar';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
// import { useAuth } from '@/contexts/AuthContext';
// import { toast } from 'sonner';
// import { ArrowUp, ArrowDown, Check, X } from 'lucide-react';
// import { DollarSign, Users, Heart } from 'lucide-react';
// import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

// interface SandboxMetrics {
//   salesChange: number;
//   loyaltyDiff: number;
//   satisfactionDiff: number;
//   beforeSales: number;
//   afterSales: number;
//   categoryComparisons: Array<{
//     category: string;
//     beforeSales: number;
//     afterSales: number;
//     change: number;
//   }>;
// }

// interface Product {
//   product_id: string;
//   brand: string;
//   price: number;
//   quality: number;
//   category: string;
// }

// interface SandboxData {
//   metrics: SandboxMetrics;
//   stagedProducts: Product[];
//   change: { change_type: string; details: any };
// }

// const Sandbox = () => {
//   const { token } = useAuth();
//   const [searchParams] = useSearchParams();

//   const navigate = useNavigate();
//   const [data, setData] = useState<SandboxData | null>(null);
//   const [loading, setLoading] = useState(true);
//   // const [changeId, setChangeId] = useState<string | null>(null);
//   const changeId = searchParams.get("change_id");

//   useEffect(() => {
//     fetchPreview();
//   }, [changeId]);

//   const fetchPreview = async () => {
//     try {
//       // setChangeId(searchParams.get("change_id"));
//       console.log("changeId",changeId);
//       const response = await fetch('/api/sandbox/preview', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ change_id: changeId }),
//       });
//       console.log(response);
//       if (!response.ok) {
//         throw new Error('Failed to fetch preview');
//       }else{
//         console.log(response);
//         toast.success('Preview loaded successfully!');
//       }
//       // console.log("inside sandbox");
//       const responseData = await response.json();
//       setData(responseData);
//       // setChangeId(responseData.change._id);
//     } catch (error) {
//       console.error('Sandbox preview error:', error);
//       toast.error('Failed to load preview');
//       setData(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCommit = async () => {
//     if (!changeId) return;
//     try {
//       const response = await fetch('/api/sandbox/commit', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ change_id: changeId }),
//       });

//       if (!response.ok) {
//         throw new Error('Failed to commit changes');
//       }

//       toast.success('Changes committed successfully!');
//       navigate('/dashboard');
//     } catch (error) {
//       console.error('Commit error:', error);
//       toast.error('Failed to commit changes');
//     }
//   };

//   const handleDiscard = async () => {
//     if (!changeId || !confirm('Are you sure you want to discard these changes?')) return;

//     try {
//       const response = await fetch('/api/sandbox/discard', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ change_id: changeId }),
//       });

//       if (!response.ok) {
//         throw new Error('Failed to discard changes');
//       }

//       toast.success('Changes discarded successfully');
//       navigate('/dashboard');
//     } catch (error) {
//       console.error('Discard error:', error);
//       toast.error('Failed to discard changes');
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-background">
//         <Navbar />
//         <div className="container mx-auto px-4 py-8">
//           <div className="flex items-center justify-center h-64">
//             <p>Loading...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!data || !data.metrics) {
//     return (
//       <div className="min-h-screen bg-background">
//         <Navbar />
//         <div className="container mx-auto px-4 py-8">
//           <p className="text-destructive">No staged changes found. Go to Products to make changes.</p>
//           <Button onClick={() => navigate('/products')} className="mt-4">
//             Go to Products
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   const { metrics, stagedProducts, change } = data;
//   const comparisonData = metrics.categoryComparisons.map(item => ({
//     ...item,
//     change: item.afterSales - item.beforeSales,
//   }));

//   return (
//     <div className="min-h-screen bg-background">
//       <Navbar />
//       <div className="container mx-auto px-4 py-8">
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-2xl font-bold">Sandbox: Preview Changes</h1>
//           <div className="flex gap-2">
//             <Button onClick={handleCommit} variant="default">
//               <Check className="h-4 w-4 mr-2" />
//               Commit Changes
//             </Button>
//             <Button onClick={handleDiscard} variant="destructive">
//               <X className="h-4 w-4 mr-2" />
//               Discard Changes
//             </Button>
//           </div>
//         </div>
//         <div className="grid gap-4">
//           <div className="grid gap-4 md:grid-cols-3">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Sales Impact</CardTitle>
//                 <CardDescription>Projected change in total sales</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex items-center gap-2">
//                   <DollarSign className="h-4 w-4 text-muted-foreground" />
//                   <span className="text-2xl font-bold">{metrics.salesChange > 0 ? '+' : ''}${metrics.salesChange.toLocaleString()}</span>
//                 </div>
//                 <div className={`flex items-center gap-1 mt-2 text-sm ${metrics.salesChange >= 0 ? 'text-success' : 'text-destructive'}`}>
//                   {metrics.salesChange >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
//                   <span>{metrics.salesChange >= 0 ? 'Increase' : 'Decrease'}</span>
//                 </div>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader>
//                 <CardTitle>Loyalty Impact</CardTitle>
//                 <CardDescription>Change in customer loyalty score</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex items-center gap-2">
//                   <Users className="h-4 w-4 text-muted-foreground" />
//                   <span className="text-2xl font-bold">{metrics.loyaltyDiff > 0 ? '+' : ''}{metrics.loyaltyDiff.toFixed(2)}</span>
//                 </div>
//                 <div className={`flex items-center gap-1 mt-2 text-sm ${metrics.loyaltyDiff >= 0 ? 'text-success' : 'text-destructive'}`}>
//                   {metrics.loyaltyDiff >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
//                   <span>{metrics.loyaltyDiff >= 0 ? 'Improved' : 'Decreased'}</span>
//                 </div>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader>
//                 <CardTitle>Satisfaction Impact</CardTitle>
//                 <CardDescription>Change in customer satisfaction score</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex items-center gap-2">
//                   <Heart className="h-4 w-4 text-muted-foreground" />
//                   <span className="text-2xl font-bold">{metrics.satisfactionDiff > 0 ? '+' : ''}{metrics.satisfactionDiff.toFixed(2)}</span>
//                 </div>
//                 <div className={`flex items-center gap-1 mt-2 text-sm ${metrics.satisfactionDiff >= 0 ? 'text-success' : 'text-destructive'}`}>
//                   {metrics.satisfactionDiff >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
//                   <span>{metrics.satisfactionDiff >= 0 ? 'Improved' : 'Decreased'}</span>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//           <Card>
//             <CardHeader>
//               <CardTitle>Change Details</CardTitle>
//               <CardDescription>Details of the staged change</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-2">
//                 <p><strong>Type:</strong> {change.change_type}</p>
//                 <p><strong>Details:</strong> {JSON.stringify(change.details)}</p>
//               </div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardHeader>
//               <CardTitle>Sales Impact by Category</CardTitle>
//               <CardDescription>Before and after comparison across product categories</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <ResponsiveContainer width="100%" height={400}>
//                 <BarChart data={comparisonData}>
//                   <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
//                   <XAxis dataKey="category" className="text-xs" />
//                   <YAxis className="text-xs" />
//                   <Tooltip />
//                   <Legend />
//                   <Bar dataKey="beforeSales" fill="hsl(var(--muted))" name="Before" />
//                   <Bar dataKey="afterSales" name="After">
//                     {comparisonData.map((entry, index) => (
//                       <Cell
//                         key={`cell-${index}`}
//                         fill={entry.change >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
//                       />
//                     ))}
//                   </Bar>
//                 </BarChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardHeader>
//               <CardTitle>Detailed Category Analysis</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Category</TableHead>
//                     <TableHead>Before Sales</TableHead>
//                     <TableHead>After Sales</TableHead>
//                     <TableHead>Change</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {comparisonData.map((item) => (
//                     <TableRow key={item.category}>
//                       <TableCell>{item.category}</TableCell>
//                       <TableCell>${item.beforeSales.toLocaleString()}</TableCell>
//                       <TableCell>${item.afterSales.toLocaleString()}</TableCell>
//                       <TableCell className={item.change >= 0 ? 'text-success' : 'text-destructive'}>
//                         {item.change >= 0 ? '+' : ''}${item.change.toLocaleString()}
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </CardContent>
//           </Card>
//           {stagedProducts.length > 0 && (
//             <Card>
//               <CardHeader>
//                 <CardTitle>Staged Products</CardTitle>
//                 <CardDescription>Products affected by the change</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Product ID</TableHead>
//                       <TableHead>Brand</TableHead>
//                       <TableHead>Price</TableHead>
//                       <TableHead>Quality</TableHead>
//                       <TableHead>Category</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {stagedProducts.map((product) => (
//                       <TableRow key={product.product_id}>
//                         <TableCell>{product.product_id}</TableCell>
//                         <TableCell>{product.brand}</TableCell>
//                         <TableCell>₹{product.price}</TableCell>
//                         <TableCell>{(product.quality*10).toFixed(1)}/10</TableCell>
//                         <TableCell>{product.category}</TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </CardContent>
//             </Card>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Sandbox;

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useSandbox } from '@/contexts/SandboxContext';
import { toast } from 'sonner';
import { ArrowUp, ArrowDown, Check, X } from 'lucide-react';
import { IndianRupee, Users, Heart } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface SandboxMetrics {
  salesChange: number;
  loyaltyDiff: number;
  satisfactionDiff: number;
  beforeSales: number;
  afterSales: number;
  categoryComparisons: Array<{
    category: string;
    beforeSales: number;
    afterSales: number;
    change: number;
  }>;
}

interface Product {
  product_id: string;
  brand: string;
  price: number;
  quality: number;
  category: string;
}

interface SandboxData {
  metrics: SandboxMetrics;
  stagedProducts: Product[];
  change: { change_type: string; details: any };
  warning?: string;
}

const Sandbox = () => {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState<SandboxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [predictionMethod, setPredictionMethod] = useState<'model' | 'fallback' | null>(null);
  const changeId = searchParams.get("change_id");
  const methodFromUrl = searchParams.get("method") as 'model' | 'fallback' | null;

  useEffect(() => {
    const defaultMethod = methodFromUrl || 'model';
    fetchPreview(defaultMethod);
  }, [changeId, methodFromUrl]);

  const fetchPreview = async (method: 'model' | 'fallback' = 'model') => {
    try {
      console.log('[INFO] Fetching preview for changeId:', changeId, 'Method:', method);
      if (!changeId) {
        throw new Error('No change_id provided');
      }
      const response = await fetch('/api/sandbox/preview', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          change_id: changeId,
          prediction_method: method 
        }),
      });
      const responseData = await response.json();
      console.log('[INFO] Response body:', responseData);
      if (!response.ok) {
        throw new Error(responseData.error || `HTTP error ${response.status}`);
      }
      if (responseData.warning) {
        toast.warning(responseData.warning);
      }
      if (!responseData.metrics || !responseData.stagedProducts) {
        throw new Error('Invalid response data');
      }
      setData(responseData);
      setPredictionMethod(method);
      toast.success(`Preview loaded successfully using ${method}!`);
    } catch (error) {
      console.error('[ERROR] Sandbox preview error:', error.message);
      toast.error(`Failed to load preview: ${error.message}`);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUseModel = () => {
    setLoading(true);
    fetchPreview('model');
  };

  const handleUseFallback = () => {
    setLoading(true);
    fetchPreview('fallback');
  };

  const handleCommit = async () => {
    if (!changeId || !data) return;
    try {
      // First commit the staged changes
      const commitResponse = await fetch('/api/sandbox/commit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ change_id: changeId }),
      });

      if (!commitResponse.ok) {
        const commitResult = await commitResponse.json();
        throw new Error(commitResult.error || 'Failed to commit staged changes');
      }

      // Now apply the actual database changes based on change type
      const changeType = data.change?.change_type;
      const changeDetails = data.change?.details;

      if (changeType === 'new_product') {
        const addResponse = await fetch('/api/products/add', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(changeDetails),
        });

        if (!addResponse.ok) {
          throw new Error('Failed to add product to database');
        }
      } else if (changeType === 'update') {
        const updateResponse = await fetch('/api/products/update', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(changeDetails),
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update product in database');
        }
      } else if (changeType === 'remove') {
        const deleteResponse = await fetch('/api/products/delete', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ product_id: changeDetails.product_id }),
        });

        if (!deleteResponse.ok) {
          throw new Error('Failed to delete product from database');
        }
      }

      toast.success('Changes committed and applied to database successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('[ERROR] Commit error:', error.message);
      toast.error(`Failed to commit changes: ${error.message}`);
    }
  };

  const handleDiscard = async () => {
    if (!changeId) return;
    try {
      const response = await fetch('/api/sandbox/discard', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ change_id: changeId }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to discard changes');
      }
      toast.success('Changes discarded successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('[ERROR] Discard error:', error.message);
      toast.error(`Failed to discard changes: ${error.message}`);
    }
  };

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><p>Loading...</p></div>;
  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Sandbox - Choose Prediction Method</h1>
          <div className="flex gap-4">
            <Button onClick={handleUseModel} size="lg" className="flex-1">
              🤖 Use Model
            </Button>
            <Button onClick={handleUseFallback} size="lg" variant="outline" className="flex-1">
              ⚡ Use Fallback
            </Button>
          </div>
          <p className="text-muted-foreground mt-4 text-center">
            Choose how to generate predictions for your staged changes
          </p>
        </div>
      </div>
    );
  }

  const { metrics, stagedProducts, change } = data;
  const salesChange = metrics.salesChange ?? 0;
  const salesChangeColor = salesChange >= 0 ? 'text-success' : 'text-destructive';
  const salesChangeIcon = salesChange >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  const loyaltyDiff = metrics.loyaltyDiff ?? 0;
  const loyaltyDiffColor = loyaltyDiff >= 0 ? 'text-success' : 'text-destructive';
  const loyaltyDiffIcon = loyaltyDiff >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  const satisfactionDiff = metrics.satisfactionDiff ?? 0;
  const satisfactionDiffColor = satisfactionDiff >= 0 ? 'text-success' : 'text-destructive';
  const satisfactionDiffIcon = satisfactionDiff >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;

  const comparisonData = metrics.categoryComparisons.map(item => ({
    category: item.category,
    beforeSales: item.beforeSales,
    afterSales: item.afterSales,
    change: item.change
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Sandbox</h1>
            <p className="text-sm text-muted-foreground">
              Using: {predictionMethod === 'model' ? '🤖 ML Model' : '⚡ Fallback System'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleUseModel}
              disabled={loading}
              variant={predictionMethod === 'model' ? 'default' : 'outline'}
              size="sm"
            >
              🤖 Model
            </Button>
            <Button
              onClick={handleUseFallback}
              disabled={loading}
              variant={predictionMethod === 'fallback' ? 'default' : 'outline'}
              size="sm"
            >
              ⚡ Fallback
            </Button>
            <Button
              onClick={handleCommit}
              disabled={!changeId || loading}
              variant="default"
            >
              <Check className="h-4 w-4 mr-2" /> Commit Changes
            </Button>
            <Button
              onClick={handleDiscard}
              disabled={!changeId || loading}
              variant="destructive"
            >
              <X className="h-4 w-4 mr-2" /> Discard Changes
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground mb-6">
          Previewing {change.change_type}: {JSON.stringify(change.details)}
        </p>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Change</CardTitle>
              <CardDescription>Projected revenue impact</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
              <span className={`text-2xl font-bold ${salesChangeColor}`}>
                {salesChange >= 0 ? '+' : ''}₹{salesChange.toLocaleString()}
              </span>
              {salesChangeIcon}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loyalty Change</CardTitle>
              <CardDescription>Projected loyalty impact</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className={`text-2xl font-bold ${loyaltyDiffColor}`}>
                {loyaltyDiff >= 0 ? '+' : ''}{loyaltyDiff.toFixed(2)}
              </span>
              {loyaltyDiffIcon}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Satisfaction Change</CardTitle>
              <CardDescription>Projected satisfaction impact</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <span className={`text-2xl font-bold ${satisfactionDiffColor}`}>
                {satisfactionDiff >= 0 ? '+' : ''}{satisfactionDiff.toFixed(2)}
              </span>
              {satisfactionDiffIcon}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Overall Sales Comparison</CardTitle>
              <CardDescription>Before vs After</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[{
                  name: 'Sales',
                  before: metrics.beforeSales,
                  after: metrics.afterSales
                }]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="before" name="Before" fill="hsl(var(--muted))" />
                  <Bar dataKey="after" name="After" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sales by Category Comparison</CardTitle>
              <CardDescription>Before vs After per category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="beforeSales" name="Before" fill="hsl(var(--muted))" />
                  <Bar dataKey="afterSales" name="After">
                    {comparisonData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.change >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Detailed Category Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Before Sales</TableHead>
                    <TableHead>After Sales</TableHead>
                    <TableHead>Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonData.map((item) => (
                    <TableRow key={item.category}>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>₹{item.beforeSales.toLocaleString()}</TableCell>
                      <TableCell>₹{item.afterSales.toLocaleString()}</TableCell>
                      <TableCell className={item.change >= 0 ? 'text-success' : 'text-destructive'}>
                        {item.change >= 0 ? '+' : ''}₹{item.change.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {stagedProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Staged Products</CardTitle>
                <CardDescription>Products affected by the change</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product ID</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stagedProducts.map((product) => (
                      <TableRow key={product.product_id}>
                        <TableCell>{product.product_id}</TableCell>
                        <TableCell>{product.brand}</TableCell>
                        <TableCell>₹{product.price}</TableCell>
                        <TableCell>{(product.quality * 10).toFixed(1)}/10</TableCell>
                        <TableCell>{product.category}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sandbox;