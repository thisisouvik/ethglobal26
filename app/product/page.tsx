import { redirect } from "next/navigation";

// Old /product route — redirect to marketplace
export default function ProductRedirect() {
  redirect("/courses");
}
