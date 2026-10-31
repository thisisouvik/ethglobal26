import { redirect } from "next/navigation";

// Old /checkout route — now handled per-course via /courses/[slug] → /pay/[orderId]
export default function CheckoutRedirect() {
  redirect("/courses");
}
