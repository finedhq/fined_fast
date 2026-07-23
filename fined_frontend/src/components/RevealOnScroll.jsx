import React, { useEffect, useRef, useState } from "react";

export default function RevealOnScroll({ children, delay = 0, threshold = 0.08, rootMargin = "0px 0px -20px 0px" }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [threshold, rootMargin]);

  const child = React.Children.only(children);
  const existingClassName = child.props.className || "";
  const className = `${existingClassName} reveal-on-scroll ${isVisible ? "is-visible" : ""}`.trim();

  return React.cloneElement(child, {
    ref,
    className,
    style: { ...child.props.style, transitionDelay: `${delay}ms` }
  });
}
