import fs from "fs";
import path from "path";
import { cwd } from "process";
import Markdown from "react-markdown";
import { SpecialComponents } from "react-markdown/lib/ast-to-react";
import { NormalComponents } from "react-markdown/lib/complex-types";
import { remark } from "remark";
import remarkGfm from "remark-gfm";

const getMarkdown = async (): Promise<any> => {
  const fullPath = path.join(cwd(), "md", "about.md");
  const fileContents = fs.readFileSync(fullPath, "utf8");

  const processedContent = await remark().process(fileContents);
  const markdown = processedContent.toString();

  // Combine the data with the id and contentHtml
  return {
    markdown,
  };
};

const components: Partial<
  Omit<NormalComponents, keyof SpecialComponents> & SpecialComponents
> = {
  h1: ({ node, ...props }) => (
    <h1 className="mb-3 text-3xl font-bold text-center" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="mb-3 text-2xl font-bold" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="mb-3 text-xl font-bold" {...props} />
  ),
  p: ({ node, ...props }) => <p className="mb-3" {...props} />,
  a: ({ node, ...props }) => {
    if (props.href && props.href.startsWith("mailto:")) {
      props = { ...props, rel: "noopener noreferrer" };
    } else {
      props = { ...props, target: "_blank", rel: "noopener noreferrer" };
    }
    return <a className="text-blue-400 hover:underline" {...props} />;
  },
  strong: ({ node, ...props }) => (
    <strong className="font-extrabold text-black" {...props} />
  ),
};

export default async function AboutPage() {
  const md = await getMarkdown();
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={components}
      className="flex flex-col w-full h-full px-5 pt-6 pb-10 overflow-y-scroll bg-white shadow-xl lg:w-1/2"
    >
      {md.markdown}
    </Markdown>
  );
}
