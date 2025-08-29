import '../styles/globals.css'
import AuthInit from './AuthInit'

export const metadata = {
	title: 'MenuCA',
	description: 'Restaurant management platform'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className="min-h-screen bg-gray-50">
				<AuthInit />
				{children}
			</body>
		</html>
	)
}


