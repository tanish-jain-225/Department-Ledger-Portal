import "@/styles/globals.css";
import { useRouter } from "next/router";
import { useEffect, useState, Component } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast-context";

function TopProgressBar() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let interval;
    let timeout;
    
    const handleStart = () => {
      clearTimeout(timeout);
      setVisible(true);
      setProgress(10);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 5;
        });
      }, 150);
    };

    const handleComplete = () => {
      clearInterval(interval);
      setProgress(100);
      timeout = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  if (!visible) return null;

  return (
    <div 
      className="fixed top-0 left-0 h-[3px] bg-brand-700 z-[9999] transition-all duration-200 ease-out pointer-events-none"
      style={{ 
        width: `${progress}%`,
        boxShadow: "0 0 10px #2563eb, 0 0 5px #2563eb"
      }}
    />
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
          <div className="text-center max-w-md">
            <div className="mx-auto h-20 w-20 rounded-3xl bg-red-50 flex items-center justify-center text-red-400 mb-6">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Something went wrong</h1>
            <p className="text-slate-500 font-medium mb-8 text-sm">An unexpected error occurred. Please refresh the page.</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/"; }}
              className="px-8 py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm transition-colors hover:bg-slate-800"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageTransition({ children }) {
  const router = useRouter();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState("page-transition-active");

  useEffect(() => {
    if (children.key !== displayChildren.key) {
      setTransitionStage("page-transition-exit");
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage("page-transition-enter");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTransitionStage("page-transition-active");
          });
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [children, displayChildren]);

  return <div className={transitionStage}>{displayChildren}</div>;
}

export default function App({ Component, pageProps, router }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <TopProgressBar />
          <PageTransition>
            <Component {...pageProps} key={router.asPath} />
          </PageTransition>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
