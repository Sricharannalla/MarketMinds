// 


import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface Product {
  product_id: string;
  brand: string;
  price: number;
  quality: number;
  category: string;
}

const Products = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Product>({
    product_id: '',
    brand: '',
    price: 0,
    quality: 0,
    category: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [modelSelectionOpen, setModelSelectionOpen] = useState(false);
  const [pendingChangeId, setPendingChangeId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('fallback');

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products?staged=false&page=${page}&limit=10&search=${encodeURIComponent(search)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products);
      setTotalPages(Math.ceil(data.total / data.limit));
    } catch (error) {
      console.error('[ERROR] Products fetch error:', error.message);
      toast.error(`Failed to load products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      product_id: product.product_id || '',
      brand: product.brand || '',
      price: isNaN(product.price) ? 0 : product.price,
      quality: isNaN(product.quality) ? 0 : product.quality,
      category: product.category || '',
    });
    setDialogOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'quality' ? (value === '' ? 0 : parseFloat(value) || 0) : value,
    }));
  };

  const handleAdd = async () => {
    try {
      if (!formData.product_id || !formData.brand || !formData.category || formData.price < 0 || formData.quality < 0 || formData.quality > 1) {
        throw new Error('Invalid product data');
      }

      // Only stage the change - don't save to DB yet
      const marketChange = await fetch('/api/sandbox/stage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          change_type: 'new_product',
          details: formData,
        }),
      });

      if (!marketChange.ok) {
        throw new Error('Failed to stage product change');
      }

      const marketChangeData = await marketChange.json();
      const changeId = marketChangeData.change?._id;
      if (!changeId) {
        throw new Error('No change ID returned from staging');
      }

      toast.success('Product staged successfully! Choose prediction method.');
      setDialogOpen(false);
      setFormData({ product_id: '', brand: '', price: 0, quality: 0, category: '' });
      setPendingChangeId(changeId);
      setModelSelectionOpen(true);
    } catch (error) {
      console.error('[ERROR] Add product error:', error.message);
      toast.error(`Failed to stage product: ${error.message}`);
    }
  };

  const handleEdit = async () => {
    if (!editingProduct) return;
    try {
      if (!formData.product_id || !formData.brand || !formData.category || formData.price < 0 || formData.quality < 0 || formData.quality > 1) {
        throw new Error('Invalid product data');
      }

      // Only stage the change - don't update DB yet
      const marketChange = await fetch('/api/sandbox/stage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          change_type: 'update',
          details: { product_id: editingProduct.product_id, ...formData },
        }),
      });

      if (!marketChange.ok) {
        throw new Error('Failed to stage product update');
      }

      const marketChangeData = await marketChange.json();
      const changeId = marketChangeData.change?._id;
      if (!changeId) {
        throw new Error('No change ID returned from staging');
      }

      toast.success('Product update staged successfully! Choose prediction method.');
      setDialogOpen(false);
      setEditingProduct(null);
      setFormData({ product_id: '', brand: '', price: 0, quality: 0, category: '' });
      setPendingChangeId(changeId);
      setModelSelectionOpen(true);
    } catch (error) {
      console.error('[ERROR] Edit product error:', error.message);
      toast.error(`Failed to stage product update: ${error.message}`);
    }
  };

  const handleDelete = async (product_id: string) => {
    if (!confirm('Are you sure you want to delete this product? This will stage the deletion for preview in Sandbox.')) return;
    
    try {
      // Only stage the change - don't delete from DB yet
      const marketChange = await fetch('/api/sandbox/stage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          change_type: 'remove',
          details: { product_id },
        }),
      });

      if (!marketChange.ok) {
        throw new Error('Failed to stage product deletion');
      }

      const marketChangeData = await marketChange.json();
      const changeId = marketChangeData.change?._id;
      if (!changeId) {
        throw new Error('No change ID returned from staging');
      }

      toast.success('Product deletion staged successfully! Choose prediction method.');
      setPendingChangeId(changeId);
      setModelSelectionOpen(true);
    } catch (error) {
      console.error('[ERROR] Delete product error:', error.message);
      toast.error(`Failed to stage product deletion: ${error.message}`);
    }
  };

  const handleModelSelection = () => {
    if (pendingChangeId && selectedModel) {
      navigate(`/sandbox?change_id=${pendingChangeId}&method=${selectedModel}`);
      setModelSelectionOpen(false);
      setPendingChangeId(null);
      setSelectedModel('fallback');
    }
  };

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><p>Loading...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Products</h1>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingProduct(null)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
                  <DialogDescription>Enter product details below.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="product_id" className="text-right">Product ID</Label>
                    <Input
                      id="product_id"
                      name="product_id"
                      value={formData.product_id}
                      onChange={handleFormChange}
                      className="col-span-3"
                      disabled={!!editingProduct}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="brand" className="text-right">Brand</Label>
                    <Input
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleFormChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">Price</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={formData.price.toString()}
                      onChange={handleFormChange}
                      className="col-span-3"
                      min="0"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quality" className="text-right">Quality (0-1)</Label>
                    <Input
                      id="quality"
                      name="quality"
                      type="number"
                      value={formData.quality.toString()}
                      onChange={handleFormChange}
                      className="col-span-3"
                      min="0"
                      max="1"
                      step="0.1"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">Category</Label>
                    <Input
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <Button onClick={editingProduct ? handleEdit : handleAdd}>
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Product List</CardTitle>
            <CardDescription>Manage your products</CardDescription>
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.product_id}>
                    <TableCell>{product.product_id}</TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell>₹{product.price}</TableCell>
                    <TableCell>{(product.quality * 10).toFixed(1)}/10</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditDialog(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(product.product_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="default"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                  >
                    <PaginationPrevious />
                  </Button>
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      onClick={() => setPage(p)}
                      isActive={p === page}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <Button
                    size="default"
                    variant="ghost"
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                  >
                    <PaginationNext />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardContent>
        </Card>

        {/* Model Selection Dialog */}
        <Dialog open={modelSelectionOpen} onOpenChange={setModelSelectionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Choose Prediction Method</DialogTitle>
              <DialogDescription>
                Select how you want to predict consumer behavior for this market change.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-4">
                <Label htmlFor="model-select">Prediction Method</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select prediction method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fallback">
                      <div className="flex flex-col">
                        <span className="font-medium">Fallback Decision Maker</span>
                        <span className="text-sm text-muted-foreground">
                          Fast rule-based predictions (Recommended)
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="model">
                      <div className="flex flex-col">
                        <span className="font-medium">AI Model</span>
                        <span className="text-sm text-muted-foreground">
                          Advanced ML predictions (Requires model server)
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setModelSelectionOpen(false);
                    setPendingChangeId(null);
                    setSelectedModel('fallback');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleModelSelection}>
                  Continue to Sandbox
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Products;