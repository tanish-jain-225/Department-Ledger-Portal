import { Html, Head, Main, NextScript } from "next/document";

const APP_NAME = "Department Ledger Portal";
const APP_DESC = "AI-powered academic records platform for departments. Track student performance, placements, achievements and generate AI readiness reports - all in one place.";

export default function Document() {
  return (
    <Html lang="en" data-scroll-behavior="smooth">
      <Head>
        {/* Primary meta */}
        <meta charSet="utf-8" />
        <mets name="name" content={APP_NAME} />
        <meta name="description" content={APP_DESC} />
        <meta name="keywords" content="academic records, student management, placement tracking, AI readiness report, department ledger, faculty dashboard, GPA tracking" />
        <meta name="author" content="Department Ledger Portal" />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#2563eb" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
