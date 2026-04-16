// pages/shop/[id].js
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import ProductCard from '../../components/ProductCard'
import { db } from '../../lib/firebase'
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore'
import { useCart } from '../../context/CartContext'
import toast from 'react-hot-toast'
import { FiHeart, FiShoppingCart, FiTruck, FiRefreshCw, FiShield, FiMessageCircle } from 'react-icons/fi'
import { FaHeart } from 'react-icons/fa'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export default function ProductDetail() {
  const router = useRouter()
  const { id } = router.query
  const { addToCart, toggleWishlist, isWishlisted } = useCart()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState('M')
  const [quantity, setQuantity] = useState(1)
  const [activeVariant, setActiveVariant] = useState(null)
  const [displayImage, setDisplayImage] = useState(null)
  const [hoveredColor, setHoveredColor] = useState(null)

  useEffect(() => {
    if (!id) return
    async function fetchProduct() {
      try {
        const docSnap = await getDoc(doc(db, 'products', id))
        if (docSnap.exists()) {
          const p = { id: docSnap.id, ...docSnap.data() }
          setProduct(p)
          setDisplayImage(p.imageUrl || null)
          // if (p.variants?.length > 0) setActiveVariant(p.variants[0])
          setActiveVariant(null) 
          const q = query(collection(db, 'products'), where('category', '==', p.category), limit(5))
          const relSnap = await getDocs(q)
          setRelated(relSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.id !== id).slice(0, 4))
        }
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    fetchProduct()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-blue-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col md:flex-row gap-10">
        <div className="md:w-1/2 h-96 bg-white rounded-2xl animate-pulse border border-blue-100" />
        <div className="flex-1 space-y-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-6 bg-white rounded animate-pulse border border-blue-100" />)}
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-blue-400 text-lg mb-4">Product not found</p>
        <Link href="/shop" className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-blue-700 transition">
          Back to Shop
        </Link>
      </div>
    </div>
  )

  const wishlisted = isWishlisted(product.id)
  const hasVariants = product.variants && product.variants.length > 0
  const hasMRP = product.mrp && product.mrp > product.price
  const discount = hasMRP ? Math.round((1 - product.price / product.mrp) * 100) : 0
  const showSizeChart = product.showSizeChart !== false
  // Displayed colour name — changes on hover, falls back to active or main
  const displayColorName = hoveredColor ?? activeVariant?.colorName ?? product.mainColorName ?? ''

  return (
    <div className="min-h-screen bg-blue-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-blue-400 mb-6">
          <Link href="/" className="hover:text-blue-600 transition">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-blue-600 transition">Shop</Link>
          <span>/</span>
          <span className="text-blue-700">{product.name}</span>
        </div>

        <div className="bg-white rounded-3xl border border-blue-100 p-6 md:p-10 flex flex-col md:flex-row gap-10">

          {/* LEFT — Image + Variant Thumbnails */}
          <div className="md:w-1/2">

            {/* Main Image with zoom effect */}
            <div className="relative rounded-2xl overflow-hidden bg-blue-50 aspect-square border border-blue-100 group cursor-zoom-in">
              {displayImage ? (
                <Image
                  src={displayImage}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl text-blue-200">👗</div>
              )}
              {/* Discount badge */}
              {hasMRP && (
                <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full z-10">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Variant Thumbnails — Amazon style */}
            {/* {hasVariants && (
              <div className="mt-4">
                <p className="text-xs text-blue-500 font-semibold uppercase tracking-widest mb-2">
                  Colour:{' '}
                  <span className="text-blue-800 normal-case tracking-normal font-bold transition-all duration-150">
                    {displayColorName || 'Default'}
                  </span>
                </p>
                <div className="flex gap-2 flex-wrap"> */}
                  {/* Default / main image thumbnail */}
                  {/* <button
                    onMouseEnter={() => {
                      setDisplayImage(product.imageUrl)
                      setHoveredColor(product.mainColorName || null)
                    }}
                    onMouseLeave={() => {
                      setDisplayImage(activeVariant?.imageUrl || product.imageUrl)
                      setHoveredColor(null)
                    }}
                    onClick={() => { setActiveVariant(null); setDisplayImage(product.imageUrl) }}
                    className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      !activeVariant
                        ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
                        : 'border-blue-100 hover:border-blue-300'
                    }`}
                  >
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="Default" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-blue-50 flex items-center justify-center text-2xl">👗</div>
                    )}
                  </button> */}

                  {/* Each colour variant thumbnail */}
                  {/* {product.variants.map((v, i) => (
                   <button
                      key={i}
                      onMouseEnter={() => {
                        setDisplayImage(v.imageUrl)
                        setHoveredColor(v.colorName)
                      }}
                      onMouseLeave={() => {
                        setDisplayImage(activeVariant ? activeVariant.imageUrl : product.imageUrl)
                        setHoveredColor(null)
                      }}
                      onClick={() => { setActiveVariant(v); setDisplayImage(v.imageUrl) }}
                      title={v.colorName}
                      className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                        activeVariant?.colorName === v.colorName
                          ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
                          : 'border-blue-100 hover:border-blue-300'
                      }`}
                    >
                      {v.imageUrl ? (
                        <img src={v.imageUrl} alt={v.colorName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-blue-50 flex items-center justify-center text-xs text-blue-400 p-1 text-center leading-tight">
                          {v.colorName}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div> */}
            {/* )} */}
          </div>

          {/* RIGHT — Product Details */}
          <div className="flex-1">
            <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              {product.category}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold font-serif text-blue-900 mb-3">{product.name}</h1>

            {/* Price with MRP strikethrough */}
            <div className="flex items-baseline gap-3 mb-1">
              <p className="text-3xl font-bold text-blue-600">₹{product.price?.toLocaleString()}</p>
              {hasMRP && (
                <>
                  <p className="text-lg text-gray-400 line-through">₹{product.mrp?.toLocaleString()}</p>
                  <span className="text-sm font-bold text-green-600">({discount}% off)</span>
                </>
              )}
            </div>
            <p className="text-xs text-blue-300 mb-5">Inclusive of all taxes</p>

            <div className="border-t border-blue-100 pt-5 mb-5">
              <p className="text-gray-500 text-sm leading-relaxed">{product.description}</p>
            </div>

            {/* Colour Selection — always shown here, above size chart */}
            {hasVariants && (
              <div className="mb-5">
                <p className="text-sm font-semibold text-blue-800 mb-2">
                  Colour:{' '}
                  <span className="text-blue-600 font-bold transition-all duration-150">
                    {displayColorName || 'Default'}
                  </span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {/* Default / main image thumbnail */}
                  <button
                    onMouseEnter={() => {
                      setDisplayImage(product.imageUrl)
                      setHoveredColor(product.mainColorName || null)
                    }}
                    onMouseLeave={() => {
                      setDisplayImage(activeVariant?.imageUrl || product.imageUrl)
                      setHoveredColor(null)
                    }}
                    onClick={() => { setActiveVariant(null); setDisplayImage(product.imageUrl) }}
                    className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      !activeVariant
                        ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
                        : 'border-blue-100 hover:border-blue-300'
                    }`}
                  >
                    {product.imageUrl
                      ? <img src={product.imageUrl} alt="Default" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-blue-50 flex items-center justify-center text-2xl">👗</div>
                    }
                  </button>
                  {/* Each colour variant */}
                  {product.variants.map((v, i) => (
                    <button
                      key={i}
                      onMouseEnter={() => {
                        setDisplayImage(v.imageUrl)
                        setHoveredColor(v.colorName)
                      }}
                      onMouseLeave={() => {
                        setDisplayImage(activeVariant ? activeVariant.imageUrl : product.imageUrl)
                        setHoveredColor(null)
                      }}
                      onClick={() => { setActiveVariant(v); setDisplayImage(v.imageUrl) }}
                      title={v.colorName}
                      className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                        activeVariant?.colorName === v.colorName
                          ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
                          : 'border-blue-100 hover:border-blue-300'
                      }`}
                    >
                      {v.imageUrl
                        ? <img src={v.imageUrl} alt={v.colorName} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-blue-50 flex items-center justify-center text-xs text-blue-400 p-1 text-center leading-tight">{v.colorName}</div>
                      }
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector — only if admin enabled it for this product */}
            {showSizeChart && (
              <div className="mb-5">
                <p className="text-sm font-semibold text-blue-800 mb-2">Select Size</p>
                <div className="flex gap-2 flex-wrap">
                  {SIZES.map(s => (
                    <button key={s} onClick={() => setSelectedSize(s)}
                      className={`w-12 h-10 rounded-lg text-sm font-semibold border transition ${
                        selectedSize === s
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-blue-200 text-blue-600 hover:border-blue-600'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-5">
              <p className="text-sm font-semibold text-blue-800 mb-2">Quantity</p>
              <div className="flex items-center gap-3 border border-blue-200 rounded-xl w-fit px-2">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-9 h-10 text-blue-700 font-bold hover:text-blue-900 transition text-lg">−</button>
                <span className="font-bold text-blue-900 w-5 text-center">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="w-9 h-10 text-blue-700 font-bold hover:text-blue-900 transition text-lg">+</button>
              </div>
            </div>

            {/* Stock status */}
            <p className={`text-xs font-semibold mb-5 ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 0 ? `✓ In Stock (${product.stock} available)` : '✗ Out of Stock'}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap mb-3">
              <button
                onClick={() => {
                  if (!product.stock) return
                  addToCart(product, selectedSize, quantity)
                  toast.success('Added to cart!')
                }}
                disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white disabled:border-gray-300 disabled:text-gray-300 font-bold py-3 rounded-xl transition"
              >
                <FiShoppingCart size={17} /> Add to Cart
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                className="w-12 h-12 rounded-xl border border-blue-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition"
              >
                {wishlisted ? <FaHeart size={17} className="text-red-500" /> : <FiHeart size={17} className="text-blue-400" />}
              </button>
            </div>

            {product.stock > 0 && (
              <button
                onClick={() => { addToCart(product, selectedSize, quantity); router.push('/checkout') }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition mb-6"
              >
                Buy Now →
              </button>
            )}

            {/* Trust Badges */}
            <div className="border-t border-blue-100 pt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: <FiTruck size={18} className="text-blue-500" />, title: 'Free Delivery', sub: 'Above ₹999' },
                { icon: <FiRefreshCw size={18} className="text-blue-500" />, title: 'Easy Returns', sub: '7-day policy' },
                { icon: <FiShield size={18} className="text-blue-500" />, title: 'Secure Pay', sub: '100% safe' },
                { icon: <FiMessageCircle size={18} className="text-green-500" />, title: 'WhatsApp', sub: 'Quick support' },
              ].map(b => (
                <div key={b.title} className="text-center bg-blue-50 rounded-xl p-3">
                  <div className="flex justify-center mb-1.5">{b.icon}</div>
                  <p className="text-xs font-bold text-blue-800">{b.title}</p>
                  <p className="text-xs text-blue-400 mt-0.5">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-14">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold font-serif text-blue-900">You May Also Like</h2>
              <Link href={`/shop?category=${product.category}`} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                View More →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}