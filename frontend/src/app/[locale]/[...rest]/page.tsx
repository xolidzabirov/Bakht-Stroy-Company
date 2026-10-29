import { notFound } from "next/navigation";

/** Any address no page matches: the shop's 404 page, inside the site layout and in the visitor's language. */
export default function UnknownPage() {
  notFound();
}
