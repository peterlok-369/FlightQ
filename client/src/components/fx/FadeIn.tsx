import { motion, type HTMLMotionProps } from "framer-motion";

interface FadeInProps extends HTMLMotionProps<"div"> {
  delay?: number;
  y?: number;
}

export function FadeIn({
  children,
  delay = 0,
  y = 10,
  transition,
  ...props
}: FadeInProps) {
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        transition ?? {
          duration: 0.36,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }
      }
      {...props}
    >
      {children}
    </motion.div>
  );
}
