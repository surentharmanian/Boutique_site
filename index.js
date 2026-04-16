// pages/shop/index.js
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import ProductCard from '../../components/ProductCard'
import { db } from '../../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

const CATEGORIES = ['All', 'Sarees', 'Chudidhar', 'Kurtis', 'Dupattas', 'Blouses']
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Name A-Z', value: 'name' },
]

export default function ShopPage() {
  const router = useRouter()
  const { search: searchQuery, category: catQuery } = router.query

  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState('All')
  const [sort, setSort] = useState('newest')

  // Search term comes only from navbar — via URL ?search=query
  const searchTerm = searchQuery ? searchQuery.toLowerCase().trim() : ''

  useEffect(() => {
    if (catQuery) setSelectedCat(catQuery)
  }, [catQuery])

  useEffect(() => {
    async function fetchAll() {
      try {
        const snap = await getDocs(collection(db, 'products'))
        setAllProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const filtered = useMemo(() => {
    return allProducts
      .filter(p => {
        const matchSearch = !searchTerm
          || p.name?.toLowerCase().includes(searchTerm)
          || p.category?.toLowerCase().includes(searchTerm)
          || p.description?.toLowerCase().includes(searchTerm)
        const matchCat = selectedCat === 'All' || p.category === selectedCat
        return matchSearch && matchCat
      })
      .sort((a, b) => {
        if (sort === 'price_asc') return a.price - b.price
        if (sort === 'price_desc') return b.price - a.price
        if (sort === 'name') return a.name?.localeCompare(b.name)
        if (a.createdAt?.seconds && b.createdAt?.seconds) {
          return b.createdAt.seconds - a.createdAt.seconds
        }
        return 0
      })
  }, [allProducts, searchTerm, selectedCat, sort])

  return (
    <div className="min-h-screen bg-blue-50">
      <Navbar />

      {/* Header */}
      <div className="bg-blue-700 text-white py-10 px-4 text-center">
        <h1 className="text-4xl font-bold font-serif">Our Collection</h1>
        {searchTerm ? (
          <p className="text-blue-200 mt-2 text-sm">
            Showing {filtered.length} result{filtered.length !== 1 ? 's' : ''} for
            <span className="text-yellow-300 font-semibold ml-1">"{searchQuery}"</span>
          </p>
        ) : (
          <p className="text-blue-200 mt-2 text-sm">
            {loading ? 'Loading...' : `${allProducts.length} handpicked products`}
          </p>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Category + Sort only — no search bar here */}
        <div className="bg-white rounded-2xl p-4 mb-6 border border-blue-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  selectedCat === cat
                    ? 'bg-blue-600 text-white'
                    : 'border border-blue-200 text-blue-600 hover:bg-blue-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="border border-blue-200 rounded-full px-4 py-2 text-sm outline-none text-blue-700 bg-white"
          >
            {SORT_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Result count */}
        <p className="text-blue-400 text-xs mb-4">{filtered.length} products</p>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-blue-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-blue-500 text-lg font-semibold mb-1">
              {searchTerm ? `No results for "${searchQuery}"` : 'No products found'}
            </p>
            <p className="text-blue-300 text-sm mb-4">Try a different search or category</p>
            <button
              onClick={() => {
                setSelectedCat('All')
                router.push('/shop')
              }}
              className="text-blue-600 border border-blue-300 px-5 py-2 rounded-full text-sm hover:bg-blue-50 transition"
            >
              Show all products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}