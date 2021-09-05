import Document, { Head, Html, Main, NextScript } from "next/document";

import React from "react";
import { ServerStyleSheets } from "@material-ui/core/styles";
//
import { palette } from "../theme";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en" dir="ltr" style={{ overflowY: "scroll" }}>
        <Head>
          <meta charSet="utf-8" />

          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

          <meta name="application-name" content="Hadeswap Analytics" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="default"
          />
          <meta
            name="apple-mobile-web-app-title"
            content="Hadeswap Analytics"
          />

          <meta
            name="description"
            content="Analytics for Hadeswap"
          />
          <meta
            name="keywords"
          />

          <link
            rel="preload"
            href="/fonts/inter-var-latin.woff2"
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />

          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />

          <meta name="msapplication-config" content="/browserconfig.xml" />
          <meta name="msapplication-TileColor" content={palette.primary.main} />
          <meta name="msapplication-tap-highlight" content="no" />

          <meta name="theme-color" content={palette.primary.main} />

          {/* <link rel="apple-touch-icon" href="/apple-icon.png"></link> */}

          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/apple-touch-icon.png"
          />

          <link
            href="/favicon-16x16.png"
            rel="icon"
            type="image/png"
            sizes="16x16"
          />

          <link
            href="/favicon-32x32.png"
            rel="icon"
            type="image/png"
            sizes="32x32"
          />

          <link rel="manifest" href="/manifest.json" />

          <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />

          <link rel="shortcut icon" href="/favicon.ico" />

          {/* TWITTER */}
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:url" content="https://analytics.hadeswap.finance" />
          <meta name="twitter:title" content="Hadeswap Analytics" />
          <meta
            name="twitter:description"
            content="Analytics for Hadeswap"
          />
          <meta name="twitter:image" content="/android-chrome-192x192.png" />
          <meta name="twitter:creator" content="@MatthewLilley" />

          {/* FACEBOOK */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content="Hadeswap Analytics" />
          <meta
            property="og:description"
            content="Analytics for Hadeswap"
          />
          <meta property="og:site_name" content="Hadeswap Analytics" />
          <meta property="og:url" content="https://analytics.hadeswap.finance" />
          <meta property="og:image" content="/apple-touch-icon.png" />
        </Head>
        <body className="no-js">
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  var query = window.matchMedia("(prefers-color-scheme: dark)");
                  var darkMode = window.localStorage.getItem("darkMode") === "true";

                  if (darkMode) {
                    document.documentElement.classList.add("dark-theme");
                  }
                } catch (e) {
                  // Silence
                }
              `,
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with server-side generation (SSG).
MyDocument.getInitialProps = async (ctx) => {
  // Resolution order
  //
  // On the server:
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. document.getInitialProps
  // 4. app.render
  // 5. page.render
  // 6. document.render
  //
  // On the server with error:
  // 1. document.getInitialProps
  // 2. app.render
  // 3. page.render
  // 4. document.render
  //
  // On the client
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. app.render
  // 4. page.render

  // Render app and page and get the context of the page with collected side effects.
  const sheets = new ServerStyleSheets();
  const originalRenderPage = ctx.renderPage;

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) => (props) => sheets.collect(<App {...props} />),
    });

  const initialProps = await Document.getInitialProps(ctx);

  return {
    ...initialProps,
    // Styles fragment is rendered after the app and page rendering finish.
    styles: [
      ...React.Children.toArray(initialProps.styles),
      sheets.getStyleElement(),
    ],
  };
};
