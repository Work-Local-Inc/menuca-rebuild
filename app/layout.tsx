import '../styles/globals.css'

export const metadata = {
	title: 'MenuCA',
	description: 'Restaurant management platform'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className="min-h-screen bg-gray-50">
				{children}
			</body>
		</html>
	)
}


