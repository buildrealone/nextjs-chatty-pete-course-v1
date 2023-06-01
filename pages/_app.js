import Head from "next/head";
import "../styles/globals.css";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { Outfit } from '@next/font/google';
// import { Outfit } from 'next/font';
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from '@fortawesome/fontawesome-svg-core';

config.autoAddCss = false; // IN OUR PRODUCTION ENVIRONMENT, PREVENT THE FLASH OF FONTAWESOME ICONS!

const outfit = Outfit({
  // weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-outfit',
});

function App({ Component, pageProps }) {
  return (
    <UserProvider>
      <Head>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <main className={`${outfit.variable} font-body`}>
        <Component {...pageProps} />
      </main>
    </UserProvider>
  );
}

export default App;
