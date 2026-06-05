
import { useCallback, useEffect, useRef, useState } from 'react'

interface NewsType {
  id: string
  title: string
  content: string
  source: string
  category: string
  published_date: string
  created_at: string
  image_url: string
  sent: string
  link?: string
  url?: string
  article_url?: string
  source_url?: string
}

const PAGE_SIZE = 10
const API_URL = 'https://links.bhusalravi.com.np/scroll'
const FALLBACK_IMAGE_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 750'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23f3f1ee'/%3E%3Cstop offset='100%25' stop-color='%23dedbd7'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='750' fill='url(%23g)'/%3E%3Ccircle cx='980' cy='170' r='150' fill='%23cfcac4' opacity='0.45'/%3E%3Crect x='120' y='110' width='360' height='22' rx='11' fill='%23b7b1aa' opacity='0.55'/%3E%3Crect x='120' y='156' width='220' height='18' rx='9' fill='%23b7b1aa' opacity='0.35'/%3E%3Cpath d='M180 570l180-170 126 106 92-84 182 148H180z' fill='%23b7b1aa' opacity='0.42'/%3E%3Ccircle cx='362' cy='302' r='56' fill='none' stroke='%23b7b1aa' stroke-width='20' opacity='0.32'/%3E%3C/svg%3E"

function formatTimestamp(value?: string) {
  if (!value) return 'Recently'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

function getArticleUrl(item: NewsType) {
  return (
    item.link ??
    item.url ??
    item.article_url ??
    item.source_url ??
    item.content.match(/https?:\/\/[^\s)]+/i)?.[0] ??
    ''
  )
}

function cleanContent(content: string, articleUrl: string) {
  if (!articleUrl) return content
  return content.replace(articleUrl, '').trim()
}

function News() {
  const [news, setNews] = useState<NewsType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [currentNews, setCurrentNews] = useState('worldnews')
  const category: string[] = ['worldnews', 'technews']
  const offset = useRef(0)
  const busy = useRef(false)

  const loadMore = useCallback(async () => {
    if (busy.current || !hasMore) return
    busy.current = true
    setLoading(true)
    setError('')

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offset: offset.current }),
      })
      if (!res.ok) throw new Error('Failed to fetch.')
      const data = await res.json()
      const items: NewsType[] = Array.isArray(data)
        ? data
        : (data.items ?? data.data ?? data.results ?? data.news ?? [])
      setNews((prev) => [...prev, ...items])
      offset.current += items.length
      setHasMore(items.length >= PAGE_SIZE)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load news.')
    } finally {
      busy.current = false
      setLoading(false)
    }
  }, [hasMore])

  useEffect(() => { loadMore() }, [loadMore])

  useEffect(() => {
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      if (scrollTop + clientHeight >= scrollHeight - 120) loadMore()
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [loadMore])

  return (
    <main
      className="relative min-h-dvh bg-[#faf9f7] px-3 text-[#1a1c1b] md:px-8"
      style={{ fontFamily: 'JetBrains Mono, monospace' }}
    >
      <section className="mx-auto w-full max-w-7xl px-3 pt-6 md:px-0 md:pt-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#695d4a]">
          Newsletter archive
        </p>
        <h1
          className="mt-2 text-3xl font-bold leading-tight text-black md:text-5xl"
          style={{ fontFamily: 'Libre Caslon Text, serif' }}
        >
          The free automated newsletter editions sent to subscribers
        </h1>
      </section>

      {/* Category switcher — unchanged */}
    <div className="sticky top-4 z-10 mx-auto mb-8 flex max-w-7xl flex-wrap items-center gap-3 px-3 py-3 md:px-0">
  <div
    className="flex shadow-lg items-center gap-2 border border-[#cfc4c5]/40 bg-[#faf9f7]/90 px-3 py-2"
    style={{ backdropFilter: 'blur(12px)' }}
  >
    <span
      className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#695d4a]"
      style={{ fontFamily: 'JetBrains Mono, monospace' }}
    >
      Edition
    </span>
    <span className="h-3 w-px bg-[#cfc4c5]" />
    {category.map((item) => (
      <button
        key={item}
        onClick={() => setCurrentNews(item)}
        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-150 ${
          item === currentNews
            ? 'bg-black text-white'
            : 'text-[#695d4a] hover:text-black'
        }`}
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        {item === 'technews' ? 'Tech' : 'World'}
      </button>
    ))}
  </div>
</div>

      {/* Grid */}
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-x-8 gap-y-20 md:grid-cols-2">
        {news.filter((item) => item.category === currentNews).map((item) => {
          const articleUrl = getArticleUrl(item)
          const content = cleanContent(item.content, articleUrl)

          return (
            <article
              key={item.id}
              className="group flex h-full flex-col"
              style={{ transition: 'transform 0.15s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {/* Image */}
              <div className="relative mb-5 aspect-16/10 overflow-hidden bg-[#efeeec]">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover opacity-95 transition-transform duration-500 group-hover:scale-[1.02]"
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_IMAGE_SRC
                      event.currentTarget.classList.add('grayscale', 'opacity-75')
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#e9e8e6]">
                    <span className="text-4xl text-[#7e7576]">✦</span>
                  </div>
                )}
                {/* Category badge */}
                <div className="absolute top-4 left-4 bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white">
                  {item.category || 'GENERAL'}
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col space-y-3">
                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#695d4a]">
                 
                  <span className="h-1 w-1 rounded-full bg-[#cfc4c5]" />
                  <span>{formatTimestamp(item.published_date || item.created_at)}</span>
                </div>

                {/* Title — always serif, italic only on hover */}
                <h2
                  className="cursor-pointer text-xl font-bold italic leading-tight text-black transition-colors duration-150 md:text-2xl"
                  style={{ fontFamily: 'Libre Caslon Text, serif' }}
                >
                  {item.title}
                </h2>

                {/* Content — small and tight for premium feel */}
                <p className="text-[11px] leading-5 tracking-wide text-[#695d4a]">
                  {content}
                </p>

                {/* Footer */}
                <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-[#cfc4c5]/30 pt-3">
                  {item.sent && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7e7576]">
                      {item.sent}
                    </span>
                  )}
                  {item.source && (
                    <a
                      href={item.source}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 border-b border-black/20 pb-0.5 text-[11px] font-bold uppercase tracking-[0.15em] text-black transition-all duration-150 hover:border-black"
                    >
                      Continue Reading →
                    </a>
                  )}
                </div>
              </div>
            </article>
          )
        })}

        {/* Loading */}
        {loading && (
          <div className="col-span-full mt-10 border-t border-[#cfc4c5]/20 py-16 text-center">
            <div className="inline-flex items-center gap-3">
              {[0, 0.2, 0.4].map((delay, i) => (
                <div
                  key={i}
                  className="h-2 w-2 animate-bounce rounded-full bg-black"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
              <span className="ml-4 text-[11px] font-bold uppercase tracking-[0.15em] text-[#695d4a]">
                LOADING MORE CLARITY...
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="col-span-full border border-[#ffdad6] bg-[#ffdad6]/30 px-4 py-3 text-sm text-[#93000a]">
            {error}
          </div>
        )}

        {/* End / hint */}
        {!loading && !hasMore && news.length > 0 && (
          <p className="col-span-full pb-8 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-[#695d4a]">
            — END OF EDITION —
          </p>
        )}
        {!loading && hasMore && news.length > 0 && (
          <p className="col-span-full pb-8 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-[#695d4a]">
            Scroll to load more.
          </p>
        )}
      </div>
    </main>
  )
}

export default News
