import "@/styles/globals.css";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast-context";

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
    <AuthProvider>
      <ToastProvider>
        <PageTransition key={router.asPath}>
          <Component {...pageProps} />
        </PageTransition>
      </ToastProvider>
    </AuthProvider>
  );
}
