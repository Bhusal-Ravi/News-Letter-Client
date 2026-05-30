import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

type DashboardResponse = {
	subscribed_users?: {
		total_users?: number
	}
	news_category?: Array<{
		category?: string
		articles_per_tag?: number
	}>
	total_articles_fetched_today?: Array<{
		category?: string
		total?: number
	}>
	total_articles_sent?: Array<{
		category?: string
		total?: number
	}>
}

type DashboardItem = {
	label: string
	value: number
}

function normalizeLabel(value?: string) {
	return value?.trim() || 'Uncategorized'
}

function sumRows(items: Array<{ total?: number; articles_per_tag?: number }>) {
	return items.reduce(
		(total, item) => total + (item.total ?? item.articles_per_tag ?? 0),
		0
	)
}

function toItems(
	items: Array<{ category?: string; total?: number; articles_per_tag?: number }>,
	key: 'total' | 'articles_per_tag'
): DashboardItem[] {
	return items.map((item) => ({
		label: normalizeLabel(item.category),
		value: item[key] ?? 0,
	}))
}

export default function App() {
	const [email, setEmail] = useState('')
	const [status, setStatus] = useState<FormStatus>('idle')
	const [message, setMessage] = useState('')
	const [subscriberCount, setSubscriberCount] = useState<string>('10+')
	const [dashboard, setDashboard] = useState<DashboardResponse>({})
	const [dashboardLoading, setDashboardLoading] = useState(true)
	const [dashboardError, setDashboardError] = useState('')

	useEffect(() => {
		fetch('https://links.bhusalravi.com.np/api/usersnumber')
			.then((res) => {
				if (!res.ok) throw new Error('Failed')
				return res.json()
			})
			.then((data: { count?: number; total?: number; number?: number } | number) => {
				const n =
					typeof data === 'number'
						? data
						: (data.count ?? data.total ?? data.number ?? null)

				if (n !== null && !isNaN(Number(n))) {
					setSubscriberCount(`${Number(n)}+`)
				} else {
					setSubscriberCount('10+')
				}
			})
			.catch(() => setSubscriberCount('10+'))
	}, [])

	useEffect(() => {
		const controller = new AbortController()

		async function loadDashboard() {
			try {
				setDashboardLoading(true)
				setDashboardError('')

				const response = await fetch('https://links.bhusalravi.com.np/api/dashboard', {
					signal: controller.signal,
				})

				if (!response.ok) {
					throw new Error('Failed to fetch dashboard data.')
				}

				const data = (await response.json()) as DashboardResponse
				setDashboard(data)
			} catch (fetchError) {
				if (!controller.signal.aborted) {
					setDashboardError(
						fetchError instanceof Error
							? fetchError.message
							: 'Failed to fetch dashboard data.'
					)
				}
			} finally {
				if (!controller.signal.aborted) {
					setDashboardLoading(false)
				}
			}
		}

		loadDashboard()

		return () => controller.abort()
	}, [])

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setStatus('loading')
		setMessage('')

		try {
			const response = await fetch(
				'https://links.bhusalravi.com.np/api/subscribe',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email }),
				}
			)

			const data = (await response.json()) as {
				message?: string
				error?: string
			}

			if (!response.ok) {
				setStatus('error')
				setMessage(data.error ?? 'Something went wrong.')
				return
			}

			setStatus('success')
			setMessage(data.message ?? 'You are subscribed.')
			setEmail('')
		} catch {
			setStatus('error')
			setMessage('Could not reach the server.')
		}
	}

	const dashboardSummary = useMemo(
		() => [
			{
				label: 'Subscribers',
				value: dashboard.subscribed_users?.total_users ?? 0,
			},
			{
				label: 'Categories',
				value: dashboard.news_category?.length ?? 0,
			},
			{
				label: 'Fetched today',
				value: sumRows(dashboard.total_articles_fetched_today ?? []),
			},
			{
					label: 'Total sent',
				value: sumRows(dashboard.total_articles_sent ?? []),
			},
		],
		[dashboard]
	)

	const categoryItems = toItems(dashboard.news_category ?? [], 'articles_per_tag')
	const fetchedItems = toItems(dashboard.total_articles_fetched_today ?? [], 'total')
	const sentItems = toItems(dashboard.total_articles_sent ?? [], 'total')

	return (
		<div className="relative min-h-dvh overflow-y-auto bg-[#faf9f8] text-neutral-900">
			<div className="absolute inset-0 -z-10 h-[60vh] bg-gradient-to-b from-[#e3dac9] via-[#f0e6d2] to-[#faf9f8]" />

			<main className="mx-auto flex w-full max-w-7xl flex-col items-center px-5 pt-24 pb-20 md:px-12 md:pt-32">
				<section className="flex w-full max-w-4xl flex-col items-center text-center">
					<div className="mb-8 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
						<div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f8dec1]" />
						Delivered at 6:00 AM · NPT
					</div>

					<h1 className="max-w-4xl font-serif text-5xl font-bold leading-tight tracking-tight text-black md:text-7xl">
						Your morning clarity,
						<br className="hidden md:block" />
						<span className="md:hidden"> </span>
						delivered.
					</h1>

					<p className="mt-8 max-w-2xl text-base leading-8 text-neutral-600 md:text-lg">
						A fully automated news experience tailored for the Asia/Kathmandu timezone.
						Fresh, precise, and waiting in your inbox every single morning.
					</p>

					<div className="mt-12 w-full max-w-xl rounded-2xl bg-gradient-to-br from-[#f8dec1] to-white p-2 shadow-2xl">
						{status === 'success' ? (
							<div className="rounded-xl border border-black/10 bg-white p-6 text-left">
								<p className="text-xs font-semibold uppercase tracking-[0.15em] text-black">
									You&apos;re subscribed ✓
								</p>

								<p className="mt-3 text-sm leading-7 text-neutral-600">
									{message}
								</p>
							</div>
						) : (
							<form
								onSubmit={handleSubmit}
								className="relative flex rounded-xl border border-black/10 bg-white/80 backdrop-blur-md"
							>
								<input
									type="email"
									required
									autoComplete="email"
									placeholder="Enter your email address"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									disabled={status === 'loading'}
									className="w-full bg-transparent px-6 py-5 pr-40 text-base outline-none placeholder:text-neutral-400"
								/>

								<button
									type="submit"
									disabled={status === 'loading'}
									className="absolute top-2 right-2 bottom-2 rounded-lg bg-black px-8 text-xs font-bold uppercase tracking-[0.15em] text-white transition hover:bg-neutral-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
								>
									{status === 'loading' ? 'Wait...' : 'Subscribe'}
								</button>
							</form>
						)}

						{status === 'error' && message && (
							<p className="mt-3 text-left text-sm text-red-700">{message}</p>
						)}

						<p className="mt-5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
							Join {subscriberCount} early risers
						</p>
					</div>

					<div className="mt-20 w-full max-w-3xl rounded-md border border-neutral-200 bg-white p-4 text-left">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
									NewsLetter stats
								</p>
							</div>
							{dashboardLoading ? (
								<span className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">
									Loading
								</span>
							) : null}
						</div>

						{dashboardError ? (
							<p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
								{dashboardError}
							</p>
						) : (
							<>
								{/* Summary stat row */}
								<div className="mt-4 flex w-full items-stretch justify-between gap-4">
									{dashboardSummary.map((item) => (
										<div
											key={item.label}
											className="flex-1 rounded-sm border border-neutral-200 bg-white px-3 py-3 text-center"
										>
											<p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
												{item.label}
											</p>
											<p className="mt-1 text-2xl font-mono font-semibold text-black">
												{dashboardLoading ? '—' : item.value}
											</p>
										</div>
									))}
								</div>

								{/* Category table: Category | articles/tag | fetched today | total sent */}
								<div className="mt-4 overflow-x-auto">
									<CategoryTable
										categories={categoryItems}
										fetched={fetchedItems}
										sent={sentItems}
										loading={dashboardLoading}
									/>
								</div>
							</>
						)}
					</div>
				</section>

				<section className="w-full py-24">
					<div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
						{[
							{
								num: '01',
								title: (
									<>
										Fully
										<br />
										<em className="italic text-[#6e5b44]">Automated</em>
									</>
								),
								body: 'Gathering and delivering the most crucial updates without human bias. Algorithms designed for signal over noise.',
							},
							{
								num: '02',
								title: (
									<>
										Morning
										<br />
										<em className="italic text-[#6e5b44]">Precision</em>
									</>
								),
								body: 'Delivered exactly at 6:00 AM local time. Establishing a predictable rhythm for your intellectual start to the day.',
							},
							{
								num: '03',
								title: (
									<>
										Global
										<br />
										<em className="italic text-[#6e5b44]">Perspective</em>
									</>
								),
								body: 'Fresh, critical news synthesized from trusted global sources. A curated lens on international developments.',
							},
						].map(({ num, title, body }) => (
							<article
								key={num}
								className="group relative overflow-hidden border border-neutral-200/70 bg-white/50 p-12 backdrop-blur-sm transition duration-500 hover:bg-white/70"
							>
								<div className="absolute -top-8 -right-4 select-none font-serif text-[10rem] font-bold leading-none text-neutral-200/40 transition group-hover:text-neutral-300/50">
									{num}
								</div>

								<div className="relative z-10 flex h-full flex-col">
									<h3 className="mb-8 font-serif text-5xl font-semibold leading-tight text-black">
										{title}
									</h3>

									<p className="mt-auto text-lg leading-8 text-neutral-600">{body}</p>
								</div>
							</article>
						))}
					</div>
				</section>
			</main>
		</div>
	)
}



function humanizeLabel(label: string) {
	const l = label.trim()
	// if ends with 'news' split into two words (e.g., worldnews -> World News)
	const m = l.match(/^(.*?)(news)$/i)
	if (m) {
		const a = m[1]
		const first = a ? a.replace(/[^a-zA-Z0-9]+/g, ' ') : ''
		return `${first ? capitalizeWords(first) + ' ' : ''}${capitalizeWords(m[2])}`.trim()
	}

	// split camelCase or snake/kebab
	const parts = l
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/[._-]+/g, ' ')
		.split(/\s+/)
		.filter(Boolean)
	return capitalizeWords(parts.join(' '))
}

function capitalizeWords(text: string) {
	return text
		.split(/\s+/)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join(' ')
}

function CategoryTable({
	categories,
	fetched,
	sent,
	loading,
}: {
	categories: DashboardItem[]
	fetched: DashboardItem[]
	sent: DashboardItem[]
	loading: boolean
}) {
	const map = (arr: DashboardItem[]) => new Map(arr.map((i) => [i.label, i.value]))
	const cMap = map(categories)
	const fMap = map(fetched)
	const sMap = map(sent)

	const labels = Array.from(new Set([...cMap.keys(), ...fMap.keys(), ...sMap.keys()]))

	return (
		<table className="w-full table-fixed border-collapse text-sm">
			<thead>
				<tr className="text-left text-xs text-neutral-500">
					<th className="w-1/3 pb-2">Category</th>
					<th className="w-1/6 pb-2">Articles/tag</th>
					<th className="w-1/6 pb-2">Fetched today</th>
					<th className="w-1/6 pb-2">Total sent</th>
				</tr>
			</thead>
			<tbody>
				{loading ? (
					<tr>
						<td colSpan={4} className="py-6 text-neutral-400">Loading…</td>
					</tr>
				) : labels.length === 0 ? (
					<tr>
						<td colSpan={4} className="py-3 text-neutral-500">No data</td>
					</tr>
				) : (
					labels.map((lbl) => {
						const display = humanizeLabel(lbl)
						const cat = cMap.get(lbl) ?? 0
						const f = fMap.get(lbl) ?? 0
						const s = sMap.get(lbl) ?? 0

						return (
							<tr key={lbl} className="border-t border-neutral-100">
								<td className="py-3 align-top text-neutral-700">{display}</td>
								<td className="py-3 align-top text-neutral-700"><span className="font-mono">{cat}</span> articles/tag</td>
								<td className="py-3 align-top text-neutral-700"><span className="font-mono">{f}</span></td>
								<td className="py-3 align-top text-neutral-700"><span className="font-mono">{s}</span></td>
							</tr>
						)
					})
				)}
			</tbody>
		</table>
	)
}
