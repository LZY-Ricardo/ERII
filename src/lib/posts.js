import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "content");

export function getSortedPostsData() {
  const fileNames = fs
    .readdirSync(postsDirectory)
    .filter((name) => name.endsWith(".mdx"));

  const allPostsData = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.mdx$/, "");
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(fileContents);

    return {
      slug,
      frontmatter: data,
    };
  });

  return allPostsData.sort((a, b) => {
    if (a.frontmatter.date < b.frontmatter.date) return 1;
    if (a.frontmatter.date > b.frontmatter.date) return -1;
    return 0;
  });
}

export function getPostData(slug) {
  const fullPath = path.join(postsDirectory, `${slug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    slug,
    frontmatter: data,
    content,
  };
}
