// src/components/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Instantly scrolls to top (0,0) whenever the path changes
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;