'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, Mail, Phone, Package, ShieldCheck, 
  MessageSquare, ArrowRight, X, FileSpreadsheet, Printer, ArrowLeft, LayoutGrid, User
} from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogTitle, DialogClose
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

// Firebase Imports
import { collection, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface Seller {
  id: string
  fullName: string
  email: string
  phone?: string
  role: string
  createdAt?: any
  productCount: number
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (userSnapshot) => {
      getDocs(collection(db, 'products')).then((prodSnapshot) => {
        const prods = prodSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllProducts(prods);
        
        const sellersData = userSnapshot.docs.map((doc) => {
          const userData = doc.data();
          const count = prods.filter((p: any) => p.seller_id === doc.id).length;
          return {
            id: doc.id,
            fullName: userData.fullName || 'No Name',
            email: userData.email || 'No Email',
            phone: userData.phone || '',
            role: userData.role || 'user',
            createdAt: userData.createdAt,
            productCount: count
          } as Seller;
        });

        setSellers(sellersData);
        setLoading(false);
      });
    });

    return () => unsubUsers();
  }, []);

  // Filter sellers based on search
  const filteredSellers = sellers.filter((s) => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone?.includes(searchQuery)
  );

  // Filter products for the MODAL view
  const sellerProducts = allProducts.filter(p => p.seller_id === selectedSeller?.id);

  // --- GLOBAL EXPORT FUNCTIONALITY (FIXED) ---
  const exportGlobalData = () => {
    // FIX 1: Use 'sellers' (ALL DATA) instead of 'filteredSellers'
    const dataToExport = sellers; 

    const headers = ["Merchant Name", "Email", "Phone", "Role", "Total Products", "Joined Date"];
    
    const rows = dataToExport.map(s => [
      `"${s.fullName}"`,
      s.email,
      // FIX 2: Add ='number' format so Excel treats phone as string, not scientific number
      s.phone ? `="${s.phone}"` : "N/A", 
      s.role,
      s.productCount,
      s.createdAt ? new Date(s.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Beecsan_All_Users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const printGlobalPage = () => {
    window.print();
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="font-bold text-slate-500 italic">Analyzing Marketplace Sync...</p>
    </div>
  )

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto bg-slate-50/30 min-h-screen">
      
      {/* --- MAIN HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Seller Intelligence</h1>
          <p className="text-slate-500 font-medium italic">Track user activity and product distribution.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
            <Button onClick={exportGlobalData} variant="outline" className="h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-2">
              <FileSpreadsheet size={18} /> Export ALL Users (CSV)
            </Button>
            <Button onClick={printGlobalPage} variant="outline" className="h-10 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold gap-2">
              <Printer size={18} /> Print Report
            </Button>
            <Badge className="h-10 px-6 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center">
              {sellers.length} Users
            </Badge>
        </div>
      </div>

      {/* Search Section */}
      <Card className="border-none shadow-sm bg-white rounded-2xl print:hidden">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <Input 
              placeholder="Search by name, email or phone..." 
              className="pl-12 h-14 border-slate-100 bg-slate-50/50 rounded-xl focus:ring-2 ring-primary/10 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sellers Table */}
      <Card className="border-none shadow-2xl overflow-hidden rounded-[24px]">
        <Table>
          <TableHeader className="bg-slate-900 h-16">
            <TableRow className="hover:bg-slate-900 border-none">
              <TableHead className="text-white font-bold px-8">MERCHANT</TableHead>
              <TableHead className="text-white font-bold">ACTIVITY</TableHead>
              <TableHead className="text-white font-bold">CONTACT</TableHead>
              <TableHead className="text-right text-white font-bold px-8 print:hidden">ANALYSIS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {filteredSellers.map((seller) => (
              <TableRow key={seller.id} className="group hover:bg-slate-50/80 transition-all border-slate-100">
                <TableCell className="py-6 px-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-xl border border-primary/5">
                      {seller.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 text-lg leading-tight">{seller.fullName}</div>
                      <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        Since {seller.createdAt?.toDate().toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-slate-900">{seller.productCount}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Products Live</span>
                    </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Mail size={14} className="text-slate-300" /> {seller.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                      <Phone size={14} className="text-slate-300" /> {seller.phone || 'No Phone'}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right px-8 print:hidden">
                  <Button 
                    onClick={() => setSelectedSeller(seller)} 
                    className="bg-slate-900 hover:bg-primary text-white font-black px-6 rounded-xl transition-all gap-2"
                  >
                    View Details <ArrowRight size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* --- FULL SCREEN USER DETAILS (FIXED LAYOUT) --- */}
      {/* --- FULL SCREEN USER DETAILS (FIXED POSITIONING) --- */}
<Dialog open={!!selectedSeller} onOpenChange={(open) => !open && setSelectedSeller(null)}>
  {/* 
      FIXED CSS:
      - !translate-x-0 !translate-y-0: Waa muhiim si uusan bidix u aadin.
      - !top-0 !left-0: Wuxuu kasoo bilaabanayaa geeska kore.
  */}
  <DialogContent className="!fixed !top-0 !left-0 !right-0 !bottom-0 !max-w-none !w-screen !h-screen !translate-x-0 !translate-y-0 !m-0 !p-0 border-none bg-slate-50 flex flex-col outline-none z-[100] overflow-hidden">
    
    <DialogTitle className="sr-only">Seller Details</DialogTitle>

    {selectedSeller && (
      <>
        {/* 1. TOP HEADER */}
        <div className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shrink-0 shadow-sm z-20 relative">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedSeller(null)} 
              className="flex items-center gap-2 hover:bg-slate-100 rounded-full px-4 py-2 text-slate-600"
            >
              <ArrowLeft size={20} />
              <span className="font-bold hidden sm:inline">Back to Dashboard</span>
            </Button>
            <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-md shadow-slate-200">
                {selectedSeller.fullName.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 leading-none">{selectedSeller.fullName}</h2>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {selectedSeller.id.slice(0, 8)}</span>
              </div>
            </div>
          </div>

          <DialogClose className="bg-slate-50 hover:bg-red-500 text-slate-500 hover:text-white w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border border-slate-200 hover:border-red-500">
            <X size={20} />
          </DialogClose>
        </div>

        {/* 2. MAIN LAYOUT (Split View) */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row h-full relative z-10">
          
          {/* LEFT SIDEBAR */}
          <div className="w-full md:w-[350px] bg-white border-r border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
            
            {/* Stats Overview */}
            <div className="p-8 bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-100 text-center shadow-sm">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-sm mx-auto mb-4 border border-slate-100">
                <LayoutGrid size={24} className="text-primary" />
              </div>
              <h3 className="text-5xl font-black text-slate-900 tracking-tight">{sellerProducts.length}</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Total Products</p>
            </div>

            {/* Merchant Details */}
            <div className="space-y-5">
              <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest border-b pb-2 text-center md:text-left">Merchant Information</h4>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 group hover:border-primary/20 transition-colors">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm text-blue-500">
                    <Mail size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{selectedSeller.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 group hover:border-primary/20 transition-colors">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm text-green-500">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Phone Number</p>
                    <p className="text-sm font-bold text-slate-700">{selectedSeller.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 group hover:border-primary/20 transition-colors">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm text-purple-500">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Account Role</p>
                    <Badge variant="secondary" className="text-[10px] uppercase font-black bg-white border border-slate-200 text-slate-600 mt-1">{selectedSeller.role}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
           <div className="mt-auto pt-6 space-y-3">
  <Button 
    className="w-full bg-[#25D366] hover:bg-[#20bd5a] font-black h-14 rounded-2xl text-white shadow-lg shadow-green-200 transition-all hover:scale-[1.02]"
    onClick={() => {
      if (selectedSeller.phone) {
        // 1. Nadiifi lambarka (ka saar calaamadaha sida + ama space)
        const cleanPhone = selectedSeller.phone.replace(/\D/g, '');
        
        // 2. Diyaari fariinta (encodeURIComponent waa muhiim si URL-ka uusan u jabin)
        const message = encodeURIComponent(
          `Asc ${selectedSeller.fullName}, waxaa kula Hadlaya maamulka Beecsan. Waxaan rabaa inaan kaala hadlo dhowr badeecadood oo aad soo gelisay app-ka beecsan...`
        );
        
        // 3. Fur WhatsApp-ka oo wata fariinta
        window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
      } else {
        alert('No phone number available');
      }
    }}
  >
    <MessageSquare className="mr-2" size={20} /> Chat on WhatsApp
  </Button>
  
  <Button variant="outline" className="w-full font-black h-14 rounded-2xl text-red-600 bg-white hover:bg-red-50 border-slate-200 hover:border-red-200 transition-all">
    <ShieldCheck className="mr-2" size={20} /> Suspend Account
  </Button>
</div>
          </div>

          {/* RIGHT CONTENT AREA */}
          <div className="flex-1 bg-slate-50/50 flex flex-col h-full overflow-hidden w-full relative">
            <ScrollArea className="flex-1 w-full h-full">
              <div className="p-6 md:p-10 min-w-full pb-20">
                {sellerProducts.length > 0 ? (
                  <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50/80 h-16 border-b border-slate-100 backdrop-blur-sm sticky top-0 z-10">
                        <TableRow className="border-none hover:bg-transparent">
                          <TableHead className="font-black text-slate-900 pl-8 w-[40%] text-xs uppercase tracking-wider">Product Details</TableHead>
                          <TableHead className="font-black text-slate-900 text-xs uppercase tracking-wider">Category</TableHead>
                          <TableHead className="font-black text-slate-900 text-xs uppercase tracking-wider">Price</TableHead>
                          <TableHead className="font-black text-slate-900 text-xs uppercase tracking-wider">Status</TableHead>
                          <TableHead className="font-black text-slate-900 text-right pr-8 text-xs uppercase tracking-wider">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sellerProducts.map((product) => (
                          <TableRow key={product.id} className="hover:bg-slate-50/80 border-b border-slate-50 last:border-0 h-28 group transition-colors">
                            <TableCell className="pl-8 py-4">
                              <div className="flex items-center gap-5">
                                <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100 shadow-sm relative group-hover:shadow-md transition-all">
                                  {product.image_urls?.[0] ? (
                                    <img src={product.image_urls[0]} alt="" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                                  ) : (
                                    <div className="flex items-center justify-center w-full h-full text-slate-300">
                                      <Package size={28} />
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <div className="font-black text-slate-900 text-base line-clamp-1">{product.title}</div>
                                  <div className="text-[10px] text-slate-400 font-bold uppercase bg-slate-100 w-fit px-2.5 py-1 rounded-lg">
                                    ID: {product.id.substring(0, 8)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="rounded-lg border-slate-200 bg-slate-50 text-slate-600 font-bold px-3 py-1">
                                {product.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-black text-slate-900 text-xl tracking-tight">${product.price}</span>
                            </TableCell>
                            <TableCell>
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                                product.status === 'APPROVED' 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                  : 'bg-orange-50 text-orange-600 border-orange-100'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${product.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                                {product.status || 'PENDING'}
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-8">
                              <Button size="sm" variant="ghost" className="h-10 w-10 p-0 rounded-full text-slate-400 hover:text-primary hover:bg-primary/5 transition-all transform hover:scale-110">
                                <ArrowRight size={20} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="h-[70vh] flex flex-col items-center justify-center text-slate-400">
                    <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                      <Package size={56} className="opacity-20 text-slate-900" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Inventory Empty</h3>
                    <p className="text-slate-500 font-medium max-w-md text-center">This merchant hasn't uploaded any products yet.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </>
    )}
  </DialogContent>
</Dialog>
    </div>
  )
}