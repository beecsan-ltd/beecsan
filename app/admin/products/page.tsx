'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Search, Eye, EyeOff, Trash2, CheckCircle, 
  XCircle, Info, Download, User, Mail, Phone, MapPin, Package
} from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"

// ✅ Firebase imports cusub oo loogu talagalay xogta seller-ka
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

import {
  onProductsUpdate,
  deleteProduct,
  updateProductVisibility,
  updateProductStatus,
} from '@/lib/firebase-admin'

interface Product {
  id: string
  title: string
  category: string
  price: number
  description?: string
  image_urls?: string[]
  visibility: 'visible' | 'hidden'
  status: 'pending' | 'approved' | 'rejected'
  seller_id?: string // ✅ Waa muhiim inaan haysano id-ga seller-ka
  seller_name?: string
  seller_email?: string
  seller_phone?: string
  city?: string
  createdAt?: any
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // ✅ 1. HALKAN KU DAR SELLER DATA STATE
  const [sellerData, setSellerData] = useState<any>(null)

  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    const unsubscribe = onProductsUpdate((snapshot: any) => {
      const productsData = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setProducts(productsData)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // ✅ 2. HALKAN KU DAR EFFECT-KA SOO JIIDAYA XOGTA SELLER-KA
  useEffect(() => {
    const fetchSellerInfo = async () => {
      if (selectedProduct?.seller_id) {
        try {
          // Waxaan ka raadinaynaa collection-ka 'users'
          const userDoc = await getDoc(doc(db, 'users', selectedProduct.seller_id));
          if (userDoc.exists()) {
            setSellerData(userDoc.data());
          } else {
            setSellerData(null);
          }
        } catch (error) {
          console.error("Error fetching seller details:", error);
          setSellerData(null);
        }
      }
    };

    fetchSellerInfo();
  }, [selectedProduct]);

  // --- ACTIONS ---
  const handleStatusChange = async (id: string, status: 'approved' | 'rejected', reason: string = '') => {
    try {
      await updateProductStatus(id, status, reason);
      setSelectedProduct(null);
      setRejectingId(null);
      setRejectReason('');
    } catch (error) {
      console.error("Status update failed:", error);
    }
  }

  const handleToggleVisibility = async (id: string, current: string) => {
    try {
      const next = current === 'visible' ? 'hidden' : 'visible';
      await updateProductVisibility(id, next);
    } catch (error) {
      console.error("Visibility toggle failed:", error);
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Ma hubtaa inaad tirtirto alaabtan? Action-kan dib looguma soo laaban karo.")) {
      await deleteProduct(id);
    }
  }

  const filteredProducts = products.filter((p) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = p.title?.toLowerCase().includes(term) || 
                          p.category?.toLowerCase().includes(term) ||
                          p.seller_name?.toLowerCase().includes(term);
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="font-bold text-slate-500 italic">Loading Marketplace Data...</p>
    </div>
  )

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto bg-slate-50/30 min-h-screen">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Inventory Management</h1>
          <p className="text-slate-500 font-medium">Control products, sellers, and marketplace visibility.</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="h-10 px-4 text-sm font-bold bg-white shadow-sm">
             Total: {filteredProducts.length}
           </Badge>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <Input 
              placeholder="Search by product, category or seller..." 
              className="pl-10 h-12 border-slate-200 focus:ring-2 ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="h-12 px-6 rounded-md border border-slate-200 bg-white font-bold text-sm outline-none focus:ring-2 ring-primary/20 cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </CardContent>
      </Card>

      {/* Main Inventory Table */}
      <Card className="border-none shadow-2xl overflow-hidden rounded-2xl">
        <Table>
          <TableHeader className="bg-slate-900">
            <TableRow className="hover:bg-slate-900 border-none">
              <TableHead className="text-slate-300 font-bold h-16 px-6">PRODUCT</TableHead>
              <TableHead className="text-slate-300 font-bold">SELLER</TableHead>
              <TableHead className="text-slate-300 font-bold">PRICE</TableHead>
              <TableHead className="text-slate-300 font-bold">VISIBILITY</TableHead>
              <TableHead className="text-slate-300 font-bold">STATUS</TableHead>
              <TableHead className="text-right text-slate-300 font-bold px-8">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {filteredProducts.map((product) => (
              <TableRow key={product.id} className="group hover:bg-slate-50 transition-colors border-slate-100">
                <TableCell className="py-5 px-6">
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-100 shadow-sm flex-shrink-0 bg-slate-50">
                      <img 
                        src={product.image_urls?.[0] || '/placeholder.jpg'} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                      />
                    </div>
                    <div>
                      <div className="font-black text-slate-900 leading-tight">{product.title}</div>
                      <div className="text-xs font-bold text-primary uppercase mt-1">{product.category}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{product.seller_name || 'Anonymous'}</span>
                    <span className="text-xs text-slate-400">{product.city || 'No City'}</span>
                  </div>
                </TableCell>
                <TableCell className="font-black text-slate-900 text-lg">${product.price}</TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleToggleVisibility(product.id, product.visibility)}
                    className={`rounded-full gap-2 font-bold ${product.visibility === 'visible' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}
                  >
                    {product.visibility === 'visible' ? <Eye size={16} /> : <EyeOff size={16} />}
                    <span className="hidden md:inline">{product.visibility}</span>
                  </Button>
                </TableCell>
                <TableCell>
                  <Badge className={`rounded-lg px-3 py-1 font-bold border-none ${
                    product.status === 'approved' ? 'bg-green-100 text-green-700' : 
                    product.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right px-8">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedProduct(product)} className="font-black border-2 hover:bg-slate-900 hover:text-white transition-all">
                        Inspect
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="text-slate-300 hover:text-red-600">
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* --- INSPECT MODAL (ENLARGED) --- */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => {
          if(!open) {
            setSelectedProduct(null);
            setSellerData(null); // ✅ Nadiifi xogta marka modal-ka la xiro
          }
      }}>
        <DialogContent className="max-w-[95vw] md:max-w-7xl w-full h-[92vh] p-0 overflow-hidden border-none rounded-[32px] shadow-2xl flex flex-col">
          {selectedProduct && (
            <div className="flex flex-col md:flex-row h-full">
              
              {/* Left Side: Image Section */}
              <div className="w-full md:w-3/5 bg-[#F8FAFC] flex items-center justify-center p-6 md:p-12 border-r border-slate-100 relative">
                <div className="absolute top-8 left-8 flex flex-col gap-2">
                   <Badge className="text-xl px-6 py-2 bg-white text-primary border-none shadow-xl font-black rounded-2xl italic">
                     ${selectedProduct.price}
                   </Badge>
                   <Badge variant="outline" className="bg-white/50 backdrop-blur font-bold border-slate-200">
                     ID: {selectedProduct.id.slice(0,8)}...
                   </Badge>
                </div>
                <img 
                  src={selectedProduct.image_urls?.[0]} 
                  className="max-h-full max-w-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl"
                  alt={selectedProduct.title}
                />
              </div>

              {/* Right Side: Details Section */}
              <div className="w-full md:w-2/5 flex flex-col h-full bg-white">
                <div className="p-10 flex-1 overflow-y-auto space-y-10">
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="bg-primary/10 text-primary border-none font-black uppercase text-[10px] tracking-tighter px-3">
                         {selectedProduct.category}
                      </Badge>
                      <Badge variant="outline" className="capitalize font-bold border-slate-200">
                         {selectedProduct.status}
                      </Badge>
                    </div>
                    <DialogTitle className="text-5xl font-black text-slate-900 tracking-tighter leading-[0.9]">
                      {selectedProduct.title}
                    </DialogTitle>
                  </DialogHeader>

                  {/* ✅ SELLER CARD - LA SAXAY SI AY XOGTU USOO MUUQATO */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                      <User size={14} className="text-primary" /> Verified Seller
                    </h4>
                    <div className="bg-slate-50 border border-slate-100 p-6 rounded-[24px] space-y-4 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-black text-xl transition-all shadow-lg shadow-primary/20">
                          {sellerData?.fullName?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-lg leading-none">
                            {sellerData?.fullName || 'Loading...'}
                          </div>
                          <div className="text-slate-400 text-sm font-medium mt-1">
                            {sellerData?.role === 'user' ? 'Professional Merchant' : 'Verified Seller'}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 pt-4 border-t border-slate-200/50">
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                          <Mail size={16} className="text-slate-300"/> 
                          {sellerData?.email || 'No Email'}
                        </div>
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                          <Phone size={16} className="text-slate-300"/> 
                          {sellerData?.phone || 'No Phone'}
                        </div>
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                          <MapPin size={16} className="text-slate-300"/> 
                          {selectedProduct.city || 'Muqdisho'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Product Overview</h4>
                    <p className="text-lg text-slate-600 leading-relaxed font-medium">
                      {selectedProduct.description || 'This seller has not provided a description for this product yet.'}
                    </p>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
                  <Button 
                    className="flex-[2] bg-emerald-600 hover:bg-emerald-700 h-16 text-xl font-black rounded-2xl shadow-xl shadow-emerald-100 transition-all hover:-translate-y-1 active:scale-95"
                    onClick={() => handleStatusChange(selectedProduct.id, 'approved')}
                  >
                    <CheckCircle className="mr-2" size={24} /> APPROVE
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1 h-16 text-xl font-black rounded-2xl shadow-xl shadow-red-100 transition-all hover:-translate-y-1 active:scale-95"
                    onClick={() => setRejectingId(selectedProduct.id)}
                  >
                    <XCircle className="mr-2" size={24} /> REJECT
                  </Button>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- REJECTION REASON MODAL --- */}
      <Dialog open={!!rejectingId} onOpenChange={() => setRejectingId(null)}>
        <DialogContent className="rounded-[32px] border-none p-8">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black flex items-center gap-3 tracking-tighter">
              <XCircle className="text-red-500" size={32} /> Reject Listing
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <p className="text-slate-500 font-bold leading-tight">
              Fadhlan qor sababta rasmiga ah ee alaabtan loo diiday. Fariintan waxaa loo diri doonaa iibiyaha (seller-ka).
            </p>
            <Textarea 
              placeholder="Tusaale: Sawirada ma fadhiyaan, ama alaabtan waa mamnuuc..." 
              className="min-h-[150px] bg-slate-50 border-slate-200 rounded-2xl p-4 font-medium focus:ring-red-100"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setRejectingId(null)} className="font-bold h-12 px-6">Cancel</Button>
            <Button 
              variant="destructive" 
              className="px-10 font-black h-12 rounded-xl"
              onClick={() => rejectingId && handleStatusChange(rejectingId, 'rejected', rejectReason)}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}