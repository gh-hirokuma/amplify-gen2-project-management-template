"use client";

import { useRouter } from "next/navigation";

import { signOut } from "aws-amplify/auth";

import { configureAmplifyClient } from "@/lib/amplify-client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  return (
    <Button
      className="h-11 rounded-xl border border-white/12 bg-white/8 px-4 text-sm font-medium text-stone-50 hover:bg-white/14"
      variant="ghost"
      onClick={async () => {
        configureAmplifyClient();
        await signOut();
        router.replace("/login");
      }}
    >
      Sign out
    </Button>
  );
}
