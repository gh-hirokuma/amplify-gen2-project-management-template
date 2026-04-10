"use client";

import { useRouter } from "next/navigation";

import { signOut } from "aws-amplify/auth";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  return (
    <Button
      className="h-11 rounded-full border border-white/12 bg-white/8 px-5 text-stone-50 hover:bg-white/14"
      variant="ghost"
      onClick={async () => {
        await signOut();
        router.replace("/login");
      }}
    >
      Sign out
    </Button>
  );
}
