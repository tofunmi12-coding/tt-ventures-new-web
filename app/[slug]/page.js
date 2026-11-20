import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import LegacyPage from "../../components/LegacyPage";

const pages = {
  shop: { file: "shop.html", title: "Shop All | TT Ventures" },
  contact: { file: "contact.html", title: "Contact Us | TT Ventures" },
  delivery: { file: "delivery.html", title: "Delivery Information | TT Ventures" },
  returns: { file: "returns.html", title: "Returns & Exchanges | TT Ventures" },
  admin: { file: "admin.html", title: "Order Admin | TT Ventures" },
  account: { file: "account.html", title: "My Account | TT Ventures" },
  "payment-callback": { file: "payment-callback.html", title: "Payment Status | TT Ventures" },
};

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) return { title: "TT Ventures" };
  const source = fs.readFileSync(path.join(process.cwd(), "public", page.file), "utf8");
  const title = source.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  return { title: title || page.title };
}

export default async function LegacyRoute({ params }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  return <LegacyPage file={page.file} />;
}
