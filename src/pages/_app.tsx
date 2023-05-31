import '@/styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <head>
        <title>Sleetcode</title>
        <meta name='viewport' content='width-device-width, initial-scale-1' />
        <link rel="icon" href="/favicon.png" />
        <meta name='description' content='Web Application that contains Leetcode problems and Code editor ' />
      </head>
      <Component {...pageProps} />
    </>
  )
}
