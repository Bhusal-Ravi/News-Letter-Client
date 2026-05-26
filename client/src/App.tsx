import { useState } from 'react'
import type { FormEvent } from 'react'

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

function App() {
	const [email, setEmail] = useState('')
	const [status, setStatus] = useState<FormStatus>('idle')
	const [message, setMessage] = useState('')

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setStatus('loading')
		setMessage('')

		try {
			const response = await fetch('https://links.bhusalravi.com.np/api/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			})

			const data = (await response.json()) as { message?: string; error?: string }

			if (!response.ok) {
				setStatus('error')
				setMessage(data.error ?? 'Something went wrong. Please try again.')
				return
			}

			setStatus('success')
			setMessage(data.message ?? 'You are subscribed.')
			setEmail('')
		} catch {
			setStatus('error')
			setMessage('Could not reach the server. Please try again.')
		}
	}

	return (
		<div className="grid h-dvh grid-rows-[auto_1fr_auto] bg-paper text-ink">
			<header className="border-b-2 border-ink px-6 pt-8 pb-7 text-center">
				<p className="stamp font-mono text-[11px] tracking-widest uppercase">
					★ free · daily ★
				</p>
				<h1 className="mt-5 font-display text-[2.75rem] leading-none font-semibold sm:text-7xl">
					Good Morning
					<span className="block italic">News</span>
				</h1>
				<div className="mt-5 flex items-center justify-center gap-3 font-mono text-[11px]">
					<span className="h-0.5 w-10 bg-ink sm:w-16" />
					<span>world + tech, no noise</span>
					<span className="h-0.5 w-10 bg-ink sm:w-16" />
				</div>
			</header>

			<main className="flex items-center justify-center px-6 py-8">
				<div className="w-full max-w-xl text-center">
					<h2 className="font-display text-3xl leading-tight italic sm:text-5xl">
						Read the day before the day reads you.
					</h2>

					<p className="mx-auto mt-5 max-w-sm font-mono text-sm leading-relaxed">
						One email. Agent-picked headlines. Zero infinite scroll guilt.
					</p>

					<div className="mt-9">
						{status === 'success' ? (
							<div
								className="mx-auto max-w-md border-2 border-ink bg-surface px-5 py-4 text-left font-mono text-sm"
								role="status"
							>
								<p className="font-medium uppercase tracking-wide">
									You&apos;re on the list ✓
								</p>
								<p className="mt-2 leading-relaxed">{message}</p>
							</div>
						) : (
							<form onSubmit={handleSubmit} className="mx-auto max-w-md">
								<label htmlFor="email" className="sr-only">
									Email address
								</label>
								<div className="flex border-2 border-ink bg-paper shadow-[5px_5px_0_0_#1a1208] transition-shadow focus-within:shadow-[3px_3px_0_0_#1a1208]">
									<input
										id="email"
										type="email"
										name="email"
										autoComplete="email"
										required
										placeholder="you@email.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										disabled={status === 'loading'}
										className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3.5 font-mono text-sm text-ink outline-none placeholder:text-ink/45 disabled:opacity-50"
									/>
									<div className="w-0.5 shrink-0 bg-ink" aria-hidden />
									<button
										type="submit"
										disabled={status === 'loading'}
										className="shrink-0 bg-ink px-6 py-3.5 font-mono text-xs font-medium tracking-wider text-paper uppercase transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{status === 'loading' ? 'Wait…' : 'Join →'}
									</button>
								</div>

								{status === 'error' && message && (
									<p
										className="mt-3 font-mono text-sm leading-relaxed"
										role="alert"
									>
										{message}
									</p>
								)}
							</form>
						)}
					</div>
				</div>
			</main>

			<footer className="border-t-2 border-ink bg-surface px-6 py-5 text-center">
				<p className="font-mono text-sm leading-relaxed sm:text-base">
					<span className="font-medium">News ships at 6:00 AM</span>
					<span className="mx-2 text-ink/40">·</span>
					Kathmandu, Nepal (NPT)
				</p>
				<p className="mt-2 font-mono text-[11px] text-ink/60">
					Straight to subscribers. Unsubscribe anytime.
				</p>
			</footer>
		</div>
	)
}

export default App
