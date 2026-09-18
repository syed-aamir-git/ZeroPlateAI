"use client";

import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function SignOutButton() {
  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      className="text-xs"
    >
      Sign out
    </Button>
  );
}
