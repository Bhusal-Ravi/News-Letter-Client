import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

export default function App() {
	const [email, setEmail] = useState('')
	const [status, setStatus] = useState<FormStatus>('idle')
	const [message, setMessage] = useState('')
	const [subscriberCount, setSubscriberCount] = useState<string>('10+')

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

	return (
		<div className="relative min-h-dvh overflow-y-auto   bg-[#faf9f8] text-neutral-900">
			{/* Background */}
			<div className="absolute inset-0 -z-10 h-[60vh] bg-gradient-to-b from-[#e3dac9] via-[#f0e6d2] to-[#faf9f8]" />

			<main className="mx-auto flex w-full max-w-7xl flex-col items-center px-5 pt-24 pb-20 md:px-12 md:pt-32">
				{/* Hero */}
				<section className="flex w-full max-w-4xl flex-col items-center text-center">
					{/* Badge */}
					<div className="mb-8 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
						<div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f8dec1]" />
						Delivered at 6:00 AM · NPT
					</div>

					{/* Heading */}
					<h1 className="max-w-4xl font-serif text-5xl font-bold leading-tight tracking-tight text-black md:text-7xl">
						Your morning clarity,
						<br className="hidden md:block" />
						<span className="md:hidden"> </span>
						delivered.
					</h1>

					{/* Subtext */}
					<p className="mt-8 max-w-2xl text-base leading-8 text-neutral-600 md:text-lg">
						A fully automated news experience tailored for the
						Asia/Kathmandu timezone. Fresh, precise, and waiting in
						your inbox every single morning.
					</p>

					{/* Subscribe */}
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
								className="relative flex  rounded-xl border border-black/10 bg-white/80 backdrop-blur-md"
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
									{status === 'loading'
										? 'Wait...'
										: 'Subscribe'}
								</button>
							</form>
						)}

						{status === 'error' && message && (
							<p className="mt-3 text-left text-sm text-red-700">
								{message}
							</p>
						)}

						<p className="mt-5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
							Join {subscriberCount} early risers
						</p>
					</div>
				</section>

				{/* Features */}
				<section className="w-full py-24">
					<div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
						{[
							{
								num: '01',
								title: (
									<>
										Fully
										<br />
										<em className="italic text-[#6e5b44]">
											Automated
										</em>
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
										<em className="italic text-[#6e5b44]">
											Precision
										</em>
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
										<em className="italic text-[#6e5b44]">
											Perspective
										</em>
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

									<p className="mt-auto text-lg leading-8 text-neutral-600">
										{body}
									</p>
								</div>
							</article>
						))}
					</div>
				</section>
			</main>
		</div>
	)
}