import type { MDXComponents } from "mdx/types";

/** Base typography for guide bodies. Guide-specific components are passed per page. */
const components: MDXComponents = {
  p: (props) => <p className="mt-4 text-lg leading-relaxed text-text-muted" {...props} />,
  h2: (props) => (
    <h2 className="mt-12 text-section font-semibold tracking-tight text-text" {...props} />
  ),
  strong: (props) => <strong className="font-semibold text-text" {...props} />,
  ul: (props) => (
    <ul className="mt-4 grid list-disc gap-2 pl-5 text-lg text-text-muted" {...props} />
  ),
  a: (props) => <a className="font-semibold text-primary-text quiet-link" {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
