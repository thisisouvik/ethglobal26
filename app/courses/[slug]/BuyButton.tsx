"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Spinner, Warning } from "@phosphor-icons/react";
import type { Course } from "@/lib/courses-data";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
});
type FormData = z.infer<typeof schema>;

export default function BuyButton({ course }: { course: Course }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          courseId: course.id,
          courseName: course.title,
          priceUsdt: course.priceUsdt,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create order");
      // Redirect to Razorpay-style payment page
      router.push(`/pay/${json.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary w-full justify-center py-3 button-md"
      >
        Enroll now
        <ArrowRight size={18} weight="bold" />
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div>
        <input
          type="text"
          placeholder="Your full name"
          className={`input-field ${errors.name ? "error" : ""}`}
          {...register("name")}
          autoComplete="name"
        />
        {errors.name && (
          <p className="caption-5 text-[#f87171] mt-1">{errors.name.message}</p>
        )}
      </div>
      <div>
        <input
          type="email"
          placeholder="your@email.com"
          className={`input-field ${errors.email ? "error" : ""}`}
          {...register("email")}
          autoComplete="email"
        />
        {errors.email && (
          <p className="caption-5 text-[#f87171] mt-1">{errors.email.message}</p>
        )}
      </div>
      {error && (
        <div
          className="flex items-start gap-2 p-3 rounded-lg"
          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)" }}
        >
          <Warning size={14} weight="fill" className="text-[#f87171] mt-0.5 shrink-0" />
          <p className="caption-5 text-[#f87171]">{error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <><Spinner size={16} className="animate-spin" /> Creating order…</>
        ) : (
          <>Proceed to payment <ArrowRight size={16} weight="bold" /></>
        )}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="caption-4 text-[var(--text-tertiary)] hover:text-white transition-colors duration-300 text-center"
      >
        Cancel
      </button>
    </form>
  );
}

